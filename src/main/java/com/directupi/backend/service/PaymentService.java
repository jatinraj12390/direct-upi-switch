package com.directupi.backend.service;

import com.directupi.backend.dto.CreatePaymentRequest;
import com.directupi.backend.dto.PaymentResponse;
import com.directupi.backend.dto.VerifyPaymentRequest;
import com.directupi.backend.entity.OrderStatus;
import com.directupi.backend.entity.PaymentOrder;
import com.directupi.backend.repository.PaymentOrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentOrderRepository orderRepository;

    @Value("${upi.default.merchant-vpa:mystore@icici}")
    private String defaultMerchantVpa;

    @Value("${upi.default.merchant-name:DirectUPI Store}")
    private String defaultMerchantName;

    public PaymentService(PaymentOrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        String orderId = "ORD_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        String vpa = (request.getMerchantVpa() != null && !request.getMerchantVpa().isBlank())
                ? request.getMerchantVpa().trim()
                : defaultMerchantVpa;

        String name = (request.getMerchantName() != null && !request.getMerchantName().isBlank())
                ? request.getMerchantName().trim()
                : defaultMerchantName;

        String note = (request.getNote() != null && !request.getNote().isBlank())
                ? request.getNote().trim()
                : "Payment for " + orderId;

        // Construct standard NPCI compliant UPI Intent URI
        String upiIntentUri = buildUpiUri(vpa, name, orderId, note, request.getAmount());

        PaymentOrder order = new PaymentOrder(orderId, request.getAmount(), vpa, name, note, upiIntentUri);
        PaymentOrder saved = orderRepository.save(order);

        return toResponse(saved);
    }

    /**
     * Confirms a payment using customer's 12-digit UTR.
     * Enforces Idempotency & Double-Spending Protection:
     * - Rejects any UTR that has already been claimed by another order.
     * - Safely returns current state if called repeatedly for the same order (Idempotent).
     * - Catches database unique index race condition violations under concurrency.
     */
    @Transactional
    public PaymentResponse verifyPayment(String orderId, VerifyPaymentRequest request) {
        PaymentOrder order = orderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        // Idempotent guard: If already paid with this exact UTR, return successfully
        if (order.getStatus() == OrderStatus.PAID) {
            return toResponse(order);
        }

        String utr = request.getUtr().trim();

        // Application-Level Guard
        orderRepository.findByUtr(utr).ifPresent(existing -> {
            if (!existing.getOrderId().equals(order.getOrderId())) {
                throw new IllegalStateException("Duplicate UTR rejected: Bank reference " + utr + " was already used for order " + existing.getOrderId());
            }
        });

        // Mark as PAID
        order.setUtr(utr);
        order.setStatus(OrderStatus.PAID);
        order.setPaidAt(LocalDateTime.now());

        try {
            PaymentOrder saved = orderRepository.saveAndFlush(order);
            return toResponse(saved);
        } catch (DataIntegrityViolationException e) {
            // Database-Level Race Condition Guard
            throw new IllegalStateException("Duplicate UTR rejected: Bank reference " + utr + " was concurrently claimed by another order");
        }
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(String orderId) {
        PaymentOrder order = orderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));
        return toResponse(order);
    }

    public String buildUpiUri(String vpa, String name, String orderId, String note, BigDecimal amount) {
        return String.format(
                "upi://pay?pa=%s&pn=%s&tr=%s&tn=%s&am=%.2f&cu=INR",
                urlEncode(vpa),
                urlEncode(name),
                urlEncode(orderId),
                urlEncode(note),
                amount.doubleValue()
        );
    }

    private String urlEncode(String val) {
        return URLEncoder.encode(val, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private PaymentResponse toResponse(PaymentOrder order) {
        return new PaymentResponse(
                order.getOrderId(),
                order.getAmount(),
                order.getMerchantVpa(),
                order.getMerchantName(),
                order.getStatus(),
                order.getUtr(),
                order.getUpiIntentUri(),
                order.getCreatedAt(),
                order.getPaidAt()
        );
    }
}
