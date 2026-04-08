package com.devtaskhub.utility.controller;

import com.devtaskhub.utility.service.AnalyticsService;
import com.devtaskhub.utility.dto.TaskStatisticsDTO;
import com.devtaskhub.utility.dto.NotificationStatisticsDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/tasks/statistics")
    public ResponseEntity<TaskStatisticsDTO> getTaskStatistics() {
        return ResponseEntity.ok(analyticsService.getTaskStatistics());
    }

    @GetMapping("/notifications/statistics")
    public ResponseEntity<NotificationStatisticsDTO> getNotificationStatistics() {
        return ResponseEntity.ok(analyticsService.getNotificationStatistics());
    }

    @GetMapping("/performance/metrics")
    public ResponseEntity<Map<String, Object>> getPerformanceMetrics() {
        return ResponseEntity.ok(analyticsService.getPerformanceMetrics());
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        return ResponseEntity.ok(analyticsService.getDashboardSummary());
    }
}
