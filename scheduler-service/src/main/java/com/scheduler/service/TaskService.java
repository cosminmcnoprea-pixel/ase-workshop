package com.scheduler.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpMethod;

import java.util.Map;
import java.util.List;

@Service
public class TaskService {
    
    private final RestTemplate restTemplate;
    
    @Value("${task.service.url}")
    private String taskServiceUrl;
    
    public TaskService() {
        this.restTemplate = new RestTemplate();
    }
    
    public List<Map<String, Object>> getAllTasks() {
        try {
            ResponseEntity<List> response = restTemplate.getForEntity(
                taskServiceUrl + "/tasks", List.class);
            return response.getBody();
        } catch (Exception e) {
            System.err.println("Failed to fetch tasks: " + e.getMessage());
            return List.of();
        }
    }
    
    public boolean isHealthy() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                taskServiceUrl + "/health", Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
}
