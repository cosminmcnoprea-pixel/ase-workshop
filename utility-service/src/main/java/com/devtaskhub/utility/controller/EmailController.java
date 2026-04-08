package com.devtaskhub.utility.controller;

import com.devtaskhub.utility.service.EmailService;
import com.devtaskhub.utility.dto.EmailRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<String> sendEmail(@RequestBody EmailRequestDTO emailRequest) {
        emailService.sendEmail(emailRequest);
        return ResponseEntity.ok("Email sent successfully");
    }

    @PostMapping("/task-reminder")
    public ResponseEntity<String> sendTaskReminder(@RequestParam String taskId, 
                                               @RequestParam String recipient) {
        emailService.sendTaskReminder(taskId, recipient);
        return ResponseEntity.ok("Task reminder sent");
    }

    @PostMapping("/daily-summary")
    public ResponseEntity<String> sendDailySummary(@RequestParam String recipient) {
        emailService.sendDailySummary(recipient);
        return ResponseEntity.ok("Daily summary sent");
    }

    @GetMapping("/templates")
    public ResponseEntity<Object> getEmailTemplates() {
        return ResponseEntity.ok(emailService.getEmailTemplates());
    }
}
