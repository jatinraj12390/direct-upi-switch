# ⚡ DirectUPI Switch — Zero-Fee UPI Payment Gateway & Concurrency-Safe Engine

> **A high-impact, production-grade Spring Boot 3 micro-engine demonstrating direct UPI P2M payment switching, NPCI URI specification compliance, idempotency, and database-level double-spend prevention under multi-threaded concurrency.**

---

## 🎯 Executive Summary (For Resumes & Portfolios)

Traditional payment gateways (Razorpay, Cashfree, Stripe) levy **2%–3% Merchant Discount Rates (MDR)** and enforce **T+1 to T+2 settlement cycles**. 

**DirectUPI Switch** is a lightweight, zero-fee direct-to-bank UPI payment engine. It generates standard NPCI-compliant payment intents, renders dynamic QR codes, and processes UTR (Unique Transaction Reference) bank settlement claims with **zero intermediary transaction fees** and **instant direct settlement**.

### 💼 Copy-Paste Resume Bullet Points
* **Developed DirectUPI Switch:** Architected a zero-fee direct UPI payment switch in **Java 17 & Spring Boot 3**, generating NPCI-compliant intent URIs and dynamic QRs for PhonePe, GPay, Paytm, and BHIM.
* **Engineered Two-Tier Double-Spend Prevention:** Prevented financial replay attacks using application-level idempotency guards coupled with DB unique index constraints, catching `DataIntegrityViolationException` on concurrent claims.
* **Multi-Threaded Stress Testing:** Verified thread-safety and race condition prevention by designing automated JUnit tests simulating **10 parallel threads** using `CountDownLatch` and `ExecutorService` (1 committed, 9 rejected with HTTP 409 Conflict).
* **High-Performance Micro-Architecture:** Designed a clean, decoupled 4-class domain layer (Controller, Service, JPA Repository, Global Exception Handler) with comprehensive Bean Validation and an interactive developer test console.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([Customer / Mobile App]) -->|1. POST /api/payments/create| Controller[PaymentController]
    Controller -->|2. Delegate| Service[PaymentService]
    Service -->|3. Construct upi://pay URI| Repo[(H2 Database / JPA)]
    Service -->|4. Return Order + QR Code| User
    
    User -->|5. Pay via GPay/PhonePe & get 12-digit UTR| User
    User -->|6. POST /api/payments/{id}/verify| Controller
    
    subgraph TwoTierGuard [Two-Tier Anti-Double-Spend Guard]
        Controller -->|Verify UTR| Service
        Service -->|Tier 1: Check findByUtr| AppCheck{Already Claimed?}
        AppCheck -->|Yes| Reject1[HTTP 409 Conflict]
        AppCheck -->|No| SaveFlush[saveAndFlush with Unique UTR Index]
        SaveFlush -->|Tier 2: Concurrent Collision| DBConstraint{DB Unique Index}
        DBConstraint -->|Violation| CatchExc[Catch DataIntegrityViolationException]
        CatchExc --> Reject2[HTTP 409 Conflict]
        DBConstraint -->|Committed| Success[HTTP 200 OK - Order PAID]
    end
```

---

## 🛡️ The Double-Spend Race Condition & Solution

### The Technical Problem
In UPI peer-to-merchant flows, customers provide their bank's **12-digit UTR** (Unique Transaction Reference) to prove payment. 
If an attacker or a faulty network retry fires **two concurrent verification requests** at the exact same millisecond:
1. Request A and Request B both query `findByUtr("428901827192")`.
2. Both queries return `Optional.empty()` because neither transaction has committed yet.
3. Both threads mark different orders as `PAID`.
4. **Result:** The merchant fulfills two orders for the cost of one payment (Classic Financial Double-Spend).

### The Two-Tier Solution
1. **Tier 1 (Application Guard):** Quick `orderRepository.findByUtr(utr)` check to reject serial duplicates with low overhead.
2. **Tier 2 (Database-Level Guarantee):** The `utr` column has a strict `@Column(unique = true)` and `idx_utr` unique index. The service calls `saveAndFlush()`. When concurrent threads collide at the database engine, only the first thread acquires the row lock; subsequent threads violate the unique constraint and throw `DataIntegrityViolationException`.
3. **Clean Exception Translation:** The service catches this exception and translates it into an idempotent, standardized **HTTP 409 Conflict** response.

---

## 🧪 Concurrency Test Proof (JUnit 5)

The project includes an automated stress test in [`PaymentConcurrencyTest.java`](src/test/java/com/directupi/backend/PaymentConcurrencyTest.java):

```java
@Test
@DisplayName("Concurrency Stress Test: 10 Parallel Threads attempting to claim identical UTR simultaneously")
void testConcurrentDoubleSpendPrevention() throws InterruptedException {
    int threadCount = 10;
    String sharedUtr = "554433221100";
    
    CountDownLatch startSignal = new CountDownLatch(1);
    CountDownLatch doneSignal = new CountDownLatch(threadCount);
    // ... fires 10 threads at the exact same millisecond using startSignal.countDown() ...
    
    assertEquals(1, successCount.get(), "Expected exactly 1 thread to succeed");
    assertEquals(9, rejectedCount.get(), "Expected 9 threads to be rejected with 409 Conflict");
}
```

### Test Execution Output:
```
[INFO] Running com.directupi.backend.PaymentConcurrencyTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 13.67 s
[INFO] BUILD SUCCESS
```

---

## 🚀 REST API Specification

### 1. Create Payment Order
`POST /api/payments/create`

**Request:**
```json
{
  "amount": 299.00,
  "merchantVpa": "mystore@icici",
  "merchantName": "Apex Apparel",
  "note": "Order #7189 Payment"
}
```

**Response (HTTP 201 Created):**
```json
{
  "orderId": "ORD_1727701928123_4A8F",
  "amount": 299.00,
  "merchantVpa": "mystore@icici",
  "merchantName": "Apex Apparel",
  "status": "PENDING",
  "utr": null,
  "upiIntentUri": "upi://pay?pa=mystore%40icici&pn=Apex%20Apparel&tr=ORD_1727701928123_4A8F&tn=Order%20%237189%20Payment&am=299.00&cu=INR",
  "createdAt": "2026-09-30T19:05:00",
  "paidAt": null
}
```

---

### 2. Verify Payment (Claim UTR)
`POST /api/payments/{orderId}/verify`

**Request:**
```json
{
  "utr": "428901827192"
}
```

**Response (HTTP 200 OK):**
```json
{
  "orderId": "ORD_1727701928123_4A8F",
  "amount": 299.00,
  "merchantVpa": "mystore@icici",
  "merchantName": "Apex Apparel",
  "status": "PAID",
  "utr": "428901827192",
  "upiIntentUri": "upi://pay?...",
  "createdAt": "2026-09-30T19:05:00",
  "paidAt": "2026-09-30T19:06:12"
}
```

**Fraud Rejection (HTTP 409 Conflict):**
```json
{
  "timestamp": "2026-09-30T19:06:15",
  "status": 409,
  "message": "Duplicate UTR rejected: Bank reference 428901827192 was already used for order ORD_1727701928123_4A8F"
}
```

---

### 3. Get Payment Status
`GET /api/payments/{orderId}`

**Response (HTTP 200 OK):**
Returns the current order state, amount, and timestamp.

---

## 🎤 3-Minute Technical Interview Pitch Script

When an interviewer asks: *"Tell me about a backend project you built and a difficult technical problem you solved."*

> "I built **DirectUPI Switch**, a zero-fee direct payment gateway microservice in **Spring Boot 3** and **Java 17**.
>
> In India, payment gateways charge 2% to 3% MDR for UPI merchant transactions. My switch bypasses intermediaries by generating standard NPCI UPI Intent URIs (`upi://pay?pa=...`) that allow customers to pay directly from GPay, PhonePe, or BHIM directly into the merchant's bank account with 0% fee.
>
> **The interesting technical challenge was preventing the Double-Spend Race Condition:**
> When customers verify payments using their bank's 12-digit UTR, malicious actors or duplicate webhook retries can send the identical UTR to two different orders concurrently. If you only check `findByUtr()` in Java code, both threads read before either commits, creating a race condition.
>
> To solve this, I designed a **two-tier defense**:
> 1. An application-level check for fast fail.
> 2. A database-level `UNIQUE INDEX` on the `utr` column with `saveAndFlush()`. When concurrent threads collide, Hibernate throws a `DataIntegrityViolationException`, which my service intercepts and maps to a clean `HTTP 409 Conflict`.
>
> To mathematically prove this under stress, I wrote a multi-threaded test with Java's `CountDownLatch` and `ExecutorService` firing **10 threads simultaneously**. The test verified that exactly 1 thread commits the payment, while the remaining 9 are safely rejected."

---

## ⚡ Quickstart Guide

### 1. Run Automated Test Suite
```bash
./mvnw test
# On Windows:
.\mvnw.cmd test
```

### 2. Start Application
```bash
./mvnw spring-boot:run
# On Windows:
.\mvnw.cmd spring-boot:run
```

### 3. Open Interactive Developer Console
Visit **[http://localhost:8080](http://localhost:8080)** in your browser to:
* Generate test payment orders and dynamic QR codes.
* Test 1-click mobile deep links.
* Run the **Live 5-Thread Race Condition Test** directly from your browser!

### 4. H2 In-Memory Database Console
Visit **[http://localhost:8080/h2-console](http://localhost:8080/h2-console)**
* **JDBC URL:** `jdbc:h2:mem:upidb`
* **Username:** `sa`
* **Password:** *(empty)*

---

## 📂 Project Structure

```
src/
├── main/
│   ├── java/com/directupi/backend/
│   │   ├── UpiBackendApplication.java
│   │   ├── controller/
│   │   │   └── PaymentController.java      # Clean REST Endpoints
│   │   ├── dto/
│   │   │   ├── CreatePaymentRequest.java   # Bean Validation
│   │   │   ├── PaymentResponse.java        # Immutable response DTO
│   │   │   └── VerifyPaymentRequest.java   # Regex UTR validator
│   │   ├── entity/
│   │   │   ├── OrderStatus.java            # PENDING, PAID, EXPIRED
│   │   │   └── PaymentOrder.java           # DB Entity with Unique Indexes
│   │   ├── exception/
│   │   │   └── GlobalExceptionHandler.java # 400, 404, 409 Conflict Handlers
│   │   ├── repository/
│   │   │   └── PaymentOrderRepository.java # Spring Data JPA
│   │   └── service/
│   │       └── PaymentService.java         # NPCI URI Builder + Concurrency Guard
│   └── resources/
│       ├── application.properties          # Port 8080 & H2 configuration
│       └── static/
│           └── index.html                  # Sleek interactive test console
└── test/
    └── java/com/directupi/backend/
        └── PaymentConcurrencyTest.java     # 10-Thread CountDownLatch Stress Test
```
