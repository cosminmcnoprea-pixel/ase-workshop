package com.scheduler.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.Map;

@Service
public class NotificationService {
    
    private final RestTemplate restTemplate;
    
    @Value("${notification.service.url}")
    private String notificationServiceUrl;
    
    public NotificationService() {
        this.restTemplate = new RestTemplate();
    }
    
    public boolean createNotification(String message, String type, String taskId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = Map.of(
                "message", message,
                "type", type,
                "taskId", taskId != null ? taskId : ""
            );
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                notificationServiceUrl + "/notifications", entity, Map.class);
            
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            System.err.println("Failed to create notification: " + e.getMessage());
            return false;
        }
    }
    
    public boolean clearAllNotifications() {
        try {
            restTemplate.delete(notificationServiceUrl + "/notifications");
            return true;
        } catch (Exception e) {
            System.err.println("Failed to clear notifications: " + e.getMessage());
            return false;
        }
    }
    
    public boolean isHealthy() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                notificationServiceUrl + "/health", Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
}
