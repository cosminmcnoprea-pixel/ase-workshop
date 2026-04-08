package com.scheduler.scheduler;

import com.scheduler.service.TaskService;
import com.scheduler.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Component
public class TaskReminderScheduler {
    
    @Autowired
    private TaskService taskService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Value("${scheduler.task-reminder.enabled}")
    private boolean taskReminderEnabled;
    
    @Scheduled(fixedDelay = 60000) // Every 60 seconds
    public void checkForOverdueTasks() {
        System.out.println("Running task reminder scheduler...");
        
        if (!taskReminderEnabled) {
            System.out.println("Task reminder disabled");
            return;
        }
        
        if (!taskService.isHealthy() || !notificationService.isHealthy()) {
            System.out.println("Skipping task reminder check - dependent services not healthy");
            return;
        }
        
        try {
            List<Map<String, Object>> tasks = taskService.getAllTasks();
            LocalDateTime now = LocalDateTime.now();
            
            for (Map<String, Object> task : tasks) {
                String status = (String) task.get("status");
                if ("todo".equals(status) || "in-progress".equals(status)) {
                    // Check if task is older than 1 hour (simplified check)
                    // In a real app, you'd check actual due dates
                    String createdAt = (String) task.get("created_at");
                    if (createdAt != null && isTaskOverdue(createdAt, now)) {
                        String taskId = (String) task.get("id");
                        String title = (String) task.get("title");
                        
                        String message = String.format("Reminder: Task '%s' needs attention!", title);
                        notificationService.createNotification(message, "warning", taskId);
                        
                        System.out.println("Created reminder for task: " + title);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error in task reminder scheduler: " + e.getMessage());
        }
    }
    
    private boolean isTaskOverdue(String createdAt, LocalDateTime now) {
        try {
            // Simple check: if task was created more than 1 minute ago (for testing)
            LocalDateTime created = LocalDateTime.parse(createdAt, DateTimeFormatter.ISO_DATE_TIME);
            return created.plusMinutes(1).isBefore(now);
        } catch (Exception e) {
            return false;
        }
    }
}
