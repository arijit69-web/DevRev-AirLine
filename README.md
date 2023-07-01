# DevRev-AirLine
## Project Description
DevRev-AirLine is a resilient and efficient Backend Application specifically developed to manage and handle a wide range of Flight Management, Booking, and Payment operations. It incorporates a Microservice MVC architecture, which guarantees both scalability and availability of the system.


## Non-Functional Requirements

### 1. To prevent conflicts and inconsistencies, the application incorporates **Transaction Isolation Level**, which ensures that no two users can simultaneously book the same seat.

### 2. To avoid unintended consequences and accidental duplicate calls during the payment process, the payment gateway implements **Idempotency APIs**.

</br>

## High Level Design 

<img src="./DevRev-AirLine.png"  width="1400" height="550">

