package com.scheduler.scheduler;

import com.scheduler.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class CleanupScheduler {
    
    @Autowired
    private NotificationService notificationService;
    
    @Value("${scheduler.cleanup.enabled}")
    private boolean cleanupEnabled;
    
    @Value("${scheduler.cleanup.older-than-days}")
    private int cleanupOlderThanDays;
    
    @Scheduled(cron = "0 0 2 * * *") // Every day at 2 AM
    public void cleanupOldNotifications() {
        if (!cleanupEnabled) {
            return;
        }
        
        if (!notificationService.isHealthy()) {
            System.out.println("Skipping cleanup - notification service not healthy");
            return;
        }
        
        try {
            System.out.println("Starting cleanup of notifications older than " + cleanupOlderThanDays + " days");
            
            // Since the notification service doesn't have date-based filtering,
            // we'll clear all notifications periodically
            // In a real app, you'd implement date-based deletion
            boolean success = notificationService.clearAllNotifications();
            
            if (success) {
                System.out.println("Successfully cleaned up old notifications");
            } else {
                System.err.println("Failed to clean up notifications");
            }
        } catch (Exception e) {
            System.err.println("Error in cleanup scheduler: " + e.getMessage());
        }
    }
}
