package com.directupi.backend;

import com.directupi.backend.dto.CreatePaymentRequest;
import com.directupi.backend.dto.PaymentResponse;
import com.directupi.backend.dto.VerifyPaymentRequest;
import com.directupi.backend.entity.OrderStatus;
import com.directupi.backend.service.PaymentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PaymentConcurrencyTest {

    @Autowired
    private PaymentService paymentService;

    @Test
    @DisplayName("1. NPCI Spec: Generates compliant upi://pay URI with proper URL encoding")
    void testBuildUpiUriFormat() {
        String uri = paymentService.buildUpiUri(
                "mystore@icici",
                "Apex Store",
                "ORD_7712",
                "Order #7712 Payment",
                new BigDecimal("499.00")
        );

        assertTrue(uri.startsWith("upi://pay?"));
        assertTrue(uri.contains("pa=mystore%40icici"));
        assertTrue(uri.contains("pn=Apex%20Store"));
        assertTrue(uri.contains("tr=ORD_7712"));
        assertTrue(uri.contains("am=499.00"));
        assertTrue(uri.contains("cu=INR"));
    }

    @Test
    @DisplayName("2. Order Lifecycle: Create Order -> Verify with 12-digit UTR -> Marked as PAID")
    void testPaymentLifecycle() {
        CreatePaymentRequest request = new CreatePaymentRequest(
                new BigDecimal("100.00"),
                "merchant@hdfc",
                "My Brand",
                "Test Checkout"
        );

        PaymentResponse created = paymentService.createPayment(request);
        assertNotNull(created.getOrderId());
        assertEquals(OrderStatus.PENDING, created.getStatus());
        assertNull(created.getUtr());

        // Simulate customer paying and providing 12-digit UTR from GPay receipt
        String utr = "428901827192";
        PaymentResponse verified = paymentService.verifyPayment(created.getOrderId(), new VerifyPaymentRequest(utr));

        assertEquals(OrderStatus.PAID, verified.getStatus());
        assertEquals(utr, verified.getUtr());
        assertNotNull(verified.getPaidAt());

        // Idempotency check: Calling verify again for the same order should succeed idempotently
        PaymentResponse repeat = paymentService.verifyPayment(created.getOrderId(), new VerifyPaymentRequest(utr));
        assertEquals(OrderStatus.PAID, repeat.getStatus());
    }

    @Test
    @DisplayName("3. Anti-Fraud: Rejects duplicate UTR reuse across two different orders")
    void testDuplicateUtrRejection() {
        PaymentResponse order1 = paymentService.createPayment(new CreatePaymentRequest(new BigDecimal("10.00"), null, null, null));
        PaymentResponse order2 = paymentService.createPayment(new CreatePaymentRequest(new BigDecimal("20.00"), null, null, null));

        String sharedUtr = "998877665544";

        // Order 1 claims UTR -> Success
        paymentService.verifyPayment(order1.getOrderId(), new VerifyPaymentRequest(sharedUtr));

        // Order 2 tries to reuse the exact same UTR -> Must throw IllegalStateException (HTTP 409 Conflict)
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            paymentService.verifyPayment(order2.getOrderId(), new VerifyPaymentRequest(sharedUtr));
        });

        assertTrue(ex.getMessage().contains("Duplicate UTR rejected"));
    }

    @Test
    @DisplayName("4. Concurrency Stress Test: 10 Parallel Threads attempting to claim identical UTR simultaneously")
    void testConcurrentDoubleSpendPrevention() throws InterruptedException {
        int threadCount = 10;
        String sharedUtr = "554433221100"; // Stolen / shared receipt reference

        // Pre-create 10 separate pending orders
        List<String> orderIds = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            PaymentResponse order = paymentService.createPayment(
                    new CreatePaymentRequest(new BigDecimal("50.00"), null, null, "Concurrent Test Order " + i)
            );
            orderIds.add(order.getOrderId());
        }

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startSignal = new CountDownLatch(1);
        CountDownLatch doneSignal = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger rejectedCount = new AtomicInteger(0);

        // Submit 10 parallel verification attempts targeting the exact same UTR
        for (int i = 0; i < threadCount; i++) {
            final String orderId = orderIds.get(i);
            executor.submit(() -> {
                try {
                    startSignal.await(); // Wait for simultaneous gun start
                    paymentService.verifyPayment(orderId, new VerifyPaymentRequest(sharedUtr));
                    successCount.incrementAndGet();
                } catch (IllegalStateException | org.springframework.dao.DataIntegrityViolationException e) {
                    // Successfully caught duplicate UTR attempt (via application guard or DB unique constraint)
                    rejectedCount.incrementAndGet();
                } catch (Exception e) {
                    // Other unexpected exceptions
                } finally {
                    doneSignal.countDown();
                }
            });
        }

        // Release the latch: all 10 threads fire at the exact same millisecond
        startSignal.countDown();
        assertTrue(doneSignal.await(10, TimeUnit.SECONDS), "Concurrent test timed out");
        executor.shutdown();

        // ASSERTION: Exactly 1 order can commit this UTR. All other 9 attempts MUST be rejected!
        assertEquals(1, successCount.get(), "Expected exactly 1 thread to succeed claiming the UTR");
        assertEquals(threadCount - 1, rejectedCount.get(), "Expected exactly " + (threadCount - 1) + " threads to be rejected with 409 Conflict");
    }
}
