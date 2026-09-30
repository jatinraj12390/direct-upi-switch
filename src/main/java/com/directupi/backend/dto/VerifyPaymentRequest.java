package com.directupi.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerifyPaymentRequest {

    @NotBlank(message = "12-digit UTR is required")
    @Pattern(regexp = "^[0-9]{12}$", message = "UTR must be a valid 12-digit numeric bank reference")
    private String utr;

    public VerifyPaymentRequest() {
    }

    public VerifyPaymentRequest(String utr) {
        this.utr = utr;
    }

    public String getUtr() {
        return utr;
    }

    public void setUtr(String utr) {
        this.utr = utr;
    }
}
