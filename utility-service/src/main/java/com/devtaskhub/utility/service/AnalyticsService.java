package com.devtaskhub.utility.service;

import com.devtaskhub.utility.dto.TaskStatisticsDTO;
import com.devtaskhub.utility.dto.NotificationStatisticsDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final JdbcTemplate jdbcTemplate;

    public TaskStatisticsDTO getTaskStatistics() {
        try {
            String sql = """
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress_tasks,
                    COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_tasks,
                    COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tasks,
                    COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority_tasks,
                    COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority_tasks
                FROM tasks
                """;
            
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> TaskStatisticsDTO.builder()
                    .totalTasks(rs.getInt("total_tasks"))
                    .completedTasks(rs.getInt("completed_tasks"))
                    .inProgressTasks(rs.getInt("in_progress_tasks"))
                    .todoTasks(rs.getInt("todo_tasks"))
                    .highPriorityTasks(rs.getInt("high_priority_tasks"))
                    .mediumPriorityTasks(rs.getInt("medium_priority_tasks"))
                    .lowPriorityTasks(rs.getInt("low_priority_tasks"))
                    .completionRate(calculateCompletionRate(rs.getInt("completed_tasks"), rs.getInt("total_tasks")))
                    .generatedAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.error("Error getting task statistics", e);
            return TaskStatisticsDTO.builder().build();
        }
    }

    public NotificationStatisticsDTO getNotificationStatistics() {
        try {
            String sql = """
                SELECT 
                    COUNT(*) as total_notifications,
                    COUNT(CASE WHEN read = false THEN 1 END) as unread_notifications,
                    COUNT(CASE WHEN read = true THEN 1 END) as read_notifications,
                    COUNT(CASE WHEN type = 'info' THEN 1 END) as info_notifications,
                    COUNT(CASE WHEN type = 'success' THEN 1 END) as success_notifications,
                    COUNT(CASE WHEN type = 'warning' THEN 1 END) as warning_notifications
                FROM notifications
                """;
            
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> NotificationStatisticsDTO.builder()
                    .totalNotifications(rs.getInt("total_notifications"))
                    .unreadNotifications(rs.getInt("unread_notifications"))
                    .readNotifications(rs.getInt("read_notifications"))
                    .infoNotifications(rs.getInt("info_notifications"))
                    .successNotifications(rs.getInt("success_notifications"))
                    .warningNotifications(rs.getInt("warning_notifications"))
                    .readRate(calculateReadRate(rs.getInt("read_notifications"), rs.getInt("total_notifications")))
                    .generatedAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.error("Error getting notification statistics", e);
            return NotificationStatisticsDTO.builder().build();
        }
    }

    public Map<String, Object> getPerformanceMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        try {
            // Database performance
            String dbMetricsSql = """
                SELECT 
                    schemaname,
                    tablename,
                    n_tup_ins as inserts,
                    n_tup_upd as updates,
                    n_tup_del as deletes
                FROM pg_stat_user_tables 
                WHERE schemaname = 'public'
                """;
            
            List<Map<String, Object>> dbMetrics = jdbcTemplate.queryForList(dbMetricsSql);
            metrics.put("database_metrics", dbMetrics);
            
            // System metrics
            Runtime runtime = Runtime.getRuntime();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            
            Map<String, Object> systemMetrics = new HashMap<>();
            systemMetrics.put("total_memory_mb", totalMemory / 1024 / 1024);
            systemMetrics.put("used_memory_mb", usedMemory / 1024 / 1024);
            systemMetrics.put("free_memory_mb", freeMemory / 1024 / 1024);
            systemMetrics.put("memory_usage_percentage", (double) usedMemory / totalMemory * 100);
            systemMetrics.put("available_processors", runtime.availableProcessors());
            
            metrics.put("system_metrics", systemMetrics);
            metrics.put("timestamp", LocalDateTime.now());
            
        } catch (Exception e) {
            log.error("Error getting performance metrics", e);
        }
        
        return metrics;
    }

    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        try {
            TaskStatisticsDTO taskStats = getTaskStatistics();
            NotificationStatisticsDTO notifStats = getNotificationStatistics();
            Map<String, Object> perfMetrics = getPerformanceMetrics();
            
            summary.put("task_statistics", taskStats);
            summary.put("notification_statistics", notifStats);
            summary.put("performance_metrics", perfMetrics);
            summary.put("generated_at", LocalDateTime.now());
            
        } catch (Exception e) {
            log.error("Error getting dashboard summary", e);
        }
        
        return summary;
    }

    private double calculateCompletionRate(int completed, int total) {
        return total > 0 ? (double) completed / total * 100 : 0.0;
    }

    private double calculateReadRate(int read, int total) {
        return total > 0 ? (double) read / total * 100 : 0.0;
    }
}
