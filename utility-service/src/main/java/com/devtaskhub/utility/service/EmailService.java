package com.devtaskhub.utility.service;

import com.devtaskhub.utility.dto.EmailRequestDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendEmail(EmailRequestDTO emailRequest) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@devtaskhub.com");
            message.setTo(emailRequest.getTo());
            message.setSubject(emailRequest.getSubject());
            message.setText(emailRequest.getBody());
            
            mailSender.send(message);
            log.info("Email sent successfully to: {}", emailRequest.getTo());
            
        } catch (Exception e) {
            log.error("Error sending email to: {}", emailRequest.getTo(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    public void sendTaskReminder(String taskId, String recipient) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@devtaskhub.com");
            message.setTo(recipient);
            message.setSubject("📋 Task Reminder - DevTask Hub");
            
            String body = buildTaskReminderBody(taskId);
            message.setText(body);
            
            mailSender.send(message);
            log.info("Task reminder sent for task: {} to: {}", taskId, recipient);
            
        } catch (Exception e) {
            log.error("Error sending task reminder for task: {} to: {}", taskId, recipient, e);
            throw new RuntimeException("Failed to send task reminder", e);
        }
    }

    public void sendDailySummary(String recipient) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@devtaskhub.com");
            message.setTo(recipient);
            message.setSubject("📊 Daily Summary - DevTask Hub");
            
            String body = buildDailySummaryBody();
            message.setText(body);
            
            mailSender.send(message);
            log.info("Daily summary sent to: {}", recipient);
            
        } catch (Exception e) {
            log.error("Error sending daily summary to: {}", recipient, e);
            throw new RuntimeException("Failed to send daily summary", e);
        }
    }

    public Map<String, Object> getEmailTemplates() {
        Map<String, Object> templates = new HashMap<>();
        
        templates.put("task_reminder", Map.of(
            "subject", "📋 Task Reminder - DevTask Hub",
            "body", "This is a reminder for your task: {taskId}"
        ));
        
        templates.put("daily_summary", Map.of(
            "subject", "📊 Daily Summary - DevTask Hub",
            "body", "Here's your daily summary of tasks and activities..."
        ));
        
        templates.put("task_completed", Map.of(
            "subject", "✅ Task Completed - DevTask Hub",
            "body", "Congratulations! You've completed the task: {taskTitle}"
        ));
        
        templates.put("task_assigned", Map.of(
            "subject", "🆕 New Task Assigned - DevTask Hub",
            "body", "You have been assigned a new task: {taskTitle}"
        ));
        
        return templates;
    }

    private String buildTaskReminderBody(String taskId) {
        return String.format("""
            Hello,
            
            This is a friendly reminder about your task in DevTask Hub.
            
            Task ID: %s
            
            Please check your DevTask Hub dashboard for more details.
            
            Best regards,
            DevTask Hub Team
            """, taskId);
    }

    private String buildDailySummaryBody() {
        return String.format("""
            Hello,
            
            Here's your daily summary from DevTask Hub:
            
            📊 Tasks Overview:
            • Total tasks: X
            • Completed today: Y
            • In progress: Z
            • Pending: W
            
            📧 Notifications:
            • New notifications: A
            • Unread: B
            
            Visit your dashboard for detailed information.
            
            Best regards,
            DevTask Hub Team
            """);
    }
}
