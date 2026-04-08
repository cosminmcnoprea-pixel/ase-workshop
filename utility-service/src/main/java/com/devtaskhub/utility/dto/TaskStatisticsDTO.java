package com.devtaskhub.utility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatisticsDTO {
    private int totalTasks;
    private int completedTasks;
    private int inProgressTasks;
    private int todoTasks;
    private int highPriorityTasks;
    private int mediumPriorityTasks;
    private int lowPriorityTasks;
    private double completionRate;
    private LocalDateTime generatedAt;
}
