package com.directupi.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_orders", indexes = {
    @Index(name = "idx_order_id", columnList = "orderId", unique = true),
    @Index(name = "idx_utr", columnList = "utr", unique = true)
})
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String orderId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 100)
    private String merchantVpa;

    @Column(nullable = false, length = 100)
    private String merchantName;

    @Column(length = 200)
    private String transactionNote;

    @Column(columnDefinition = "TEXT")
    private String upiIntentUri;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(unique = true, length = 32)
    private String utr; // Unique 12-digit bank reference

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime paidAt;

    public PaymentOrder() {
    }

    public PaymentOrder(String orderId, BigDecimal amount, String merchantVpa, String merchantName, String transactionNote, String upiIntentUri) {
        this.orderId = orderId;
        this.amount = amount;
        this.merchantVpa = merchantVpa;
        this.merchantName = merchantName;
        this.transactionNote = transactionNote;
        this.upiIntentUri = upiIntentUri;
        this.status = OrderStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getMerchantVpa() {
        return merchantVpa;
    }

    public void setMerchantVpa(String merchantVpa) {
        this.merchantVpa = merchantVpa;
    }

    public String getMerchantName() {
        return merchantName;
    }

    public void setMerchantName(String merchantName) {
        this.merchantName = merchantName;
    }

    public String getTransactionNote() {
        return transactionNote;
    }

    public void setTransactionNote(String transactionNote) {
        this.transactionNote = transactionNote;
    }

    public String getUpiIntentUri() {
        return upiIntentUri;
    }

    public void setUpiIntentUri(String upiIntentUri) {
        this.upiIntentUri = upiIntentUri;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getUtr() {
        return utr;
    }

    public void setUtr(String utr) {
        this.utr = utr;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }
}
