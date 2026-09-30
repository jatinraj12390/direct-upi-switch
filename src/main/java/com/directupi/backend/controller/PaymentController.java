package com.directupi.backend.controller;

import com.directupi.backend.dto.CreatePaymentRequest;
import com.directupi.backend.dto.PaymentResponse;
import com.directupi.backend.dto.VerifyPaymentRequest;
import com.directupi.backend.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create")
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{orderId}/verify")
    public ResponseEntity<PaymentResponse> verifyPayment(
            @PathVariable String orderId,
            @Valid @RequestBody VerifyPaymentRequest request) {
        PaymentResponse response = paymentService.verifyPayment(orderId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable String orderId) {
        PaymentResponse response = paymentService.getPayment(orderId);
        return ResponseEntity.ok(response);
    }
}
