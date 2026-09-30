package com.directupi.backend.dto;

import com.directupi.backend.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {

    private String orderId;
    private BigDecimal amount;
    private String merchantVpa;
    private String merchantName;
    private OrderStatus status;
    private String utr;
    private String upiIntentUri;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    public PaymentResponse() {
    }

    public PaymentResponse(String orderId, BigDecimal amount, String merchantVpa, String merchantName, OrderStatus status, String utr, String upiIntentUri, LocalDateTime createdAt, LocalDateTime paidAt) {
        this.orderId = orderId;
        this.amount = amount;
        this.merchantVpa = merchantVpa;
        this.merchantName = merchantName;
        this.status = status;
        this.utr = utr;
        this.upiIntentUri = upiIntentUri;
        this.createdAt = createdAt;
        this.paidAt = paidAt;
    }

    public String getOrderId() {
        return orderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getMerchantVpa() {
        return merchantVpa;
    }

    public String getMerchantName() {
        return merchantName;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public String getUtr() {
        return utr;
    }

    public String getUpiIntentUri() {
        return upiIntentUri;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }
}
