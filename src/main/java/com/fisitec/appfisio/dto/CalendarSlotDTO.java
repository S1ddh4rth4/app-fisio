package com.fisitec.appfisio.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarSlotDTO {

    private LocalDateTime start;
    private LocalDateTime end;

}
