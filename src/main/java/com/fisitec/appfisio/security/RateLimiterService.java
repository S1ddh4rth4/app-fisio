package com.fisitec.appfisio.security;

import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio de Rate Limiting en memoria mediante ventana deslizante por IP.
 * Mitiga ataques de fuerza bruta en autenticación sin riesgo de Account Lockout
 * DoS.
 */
@Service
public class RateLimiterService {

    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final long WINDOW_SIZE_MILLIS = 60_000L; // 1 minuto

    private static class IpRequestWindow {
        private final Deque<Long> timestamps = new ArrayDeque<>();

        synchronized boolean allowRequest(long now) {
            long windowStart = now - WINDOW_SIZE_MILLIS;
            while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= MAX_REQUESTS_PER_MINUTE) {
                return false;
            }
            timestamps.addLast(now);
            return true;
        }

        synchronized boolean isExpired(long now) {
            return timestamps.isEmpty() || (now - timestamps.peekLast() > WINDOW_SIZE_MILLIS * 2);
        }
    }

    private final Map<String, IpRequestWindow> ipWindows = new ConcurrentHashMap<>();

    /**
     * Evalúa si una dirección IP tiene permitido realizar un intento de inicio de
     * sesión.
     */
    public boolean isAllowed(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            return true;
        }
        long now = System.currentTimeMillis();
        IpRequestWindow window = ipWindows.computeIfAbsent(clientIp, k -> new IpRequestWindow());
        boolean allowed = window.allowRequest(now);

        // Limpieza pasiva si el mapa almacena muchas IPs para proteger la memoria RAM
        if (ipWindows.size() > 1000) {
            ipWindows.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
        }

        return allowed;
    }
}