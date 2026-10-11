package com.fisitec.appfisio.controller;

import com.fisitec.appfisio.dto.DashboardSummaryDTO;
import com.fisitec.appfisio.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

        private final DashboardService dashboardService;

        @GetMapping("/summary")
        @PreAuthorize("hasAnyRole('ADMIN', 'FISIOTERAPEUTA', 'RECEPCION')")
        public ResponseEntity<DashboardSummaryDTO> getSummary(Authentication authentication) {
                boolean isStaffAdmin = authentication.getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                                                || a.getAuthority().equals("ROLE_RECEPCION"));

                return ResponseEntity.ok(dashboardService.getSummary(authentication.getName(), isStaffAdmin));
        }
}