# Conflict User Stories

## VBS-1 and VBS-2

### VBS-1

- Key: VBS-1

- Summary
  As a Passenger, I want to cancel my trip at any time before the driver arrives so that I have maximum flexibility.

---

- Description
  Passengers can cancel a booking without penalty until the driver is within 100 meters of the pickup point.
  No cancellation fees shall be applied if the trip has not started.
  System must update trip status to 'Cancelled' immediately upon request.

### VBS-2

- Key: VBS-2

- Summary
  As a Driver, I want to receive a cancellation fee if the passenger cancels after 2 minutes of booking so that my time is compensated.

---

- Description
  If a passenger cancels more than 120 seconds after the initial booking, a flat $5 fee is charged.
  Cancellation is blocked if the driver is already en route for more than 5 minutes.
  This rule applies regardless of the driver's current distance from the passenger.

## VBS-3 and VBS-4

### VBS-3

- Key: VBS-3

- Summary
  As a Passenger, I want to chat with the driver via an in-app messenger so that I can provide specific pickup instructions.

---

- Description
  The system must support real-time text messaging between assigned parties.
  Messages must be stored permanently in the database for safety audits.
  Chat remains active for 24 hours after the trip is completed.

### VBS-4

- Key: VBS-4

- Summary
  As a System Administrator, I want to protect user privacy by preventing any direct communication between users so that we avoid off-platform transactions.

---

- Description
  All communication must be routed through automated IVR phone masking only.
  No text-based messaging or storage of chat logs is permitted to comply with strict data privacy laws.
  Any active communication channel must be destroyed immediately once the trip status is 'Completed'.

# Duplication User Stories

## VBS-301 and VBS-302

### VBS-301

- Key: VBS-301

- Summary
  As a Passenger, I want to book a ride by entering my destination so that a driver can find me.

---

- Description
  The user enters a destination address in the search bar.
  The system calculates the estimated fare and shows available vehicle types.
  Upon clicking 'Confirm,' the system searches for the nearest available driver.

### VBS-302

- Key: VBS-302

- Summary
  As a User, I want to request a vehicle to a specific location so that I can travel to my destination.

---

- Description
  Users provide a drop-off point and see a list of cars nearby.
  The app displays the price for the trip before the user confirms the request.
  Matching logic initiates to find a driver once the user submits the booking.

## VBS-401 and VBS-402

### VBS-401

- Key: VBS-401

- Summary
  As a Passenger, I want to pay for my ride using a Credit Card so that the transaction is cashless.

---

- Description
  Integrate the Stripe payment gateway to handle Visa and Mastercard transactions.
  Store a tokenized version of the card for future use.
  Execute the charge automatically when the driver clicks 'End Trip'.

### VBS-402

- Key: VBS-402

- Summary
  As a System, I want to process automated payments at the end of a journey so that drivers get paid promptly.

---

- Description
  Trigger a payment request to the external gateway (Stripe) once a ride is completed.
  The system should support all major credit card providers.
  Ensure the transaction status is updated in the billing ledger immediately.

# Not Independent User Stories

## VBS-801

- Key: VBS-801

- Summary
  As a Passenger, I want to receive a digital tax receipt via email so that I can track my business expenses.

---

- Description
  This story is strictly blocked by VBS-401; do not start until the Stripe integration is finished.
  The receipt must pull the specific transaction ID and card masking details generated in VBS-401.
  Automatically trigger the email only after the payment status is confirmed as 'Succeeded'.

## VBS-802

- Key: VBS-802

- Summary
  As a Driver, I want to view my 'Verification Badge' on my profile so that passengers trust my credentials.

---

- Description
  The badge only appears if the background check from VBS-602 returns a 'Clear' status.
  This feature relies on the document upload UI being fully operational as defined in VBS-602.
  If the background check is pending, the badge must remain invisible to the user.

# Not Valuable User Stories

## VBS-501

- Key: VBS-501

- Summary
  As a Developer, I want to optimize the database indexes so that the system runs better.

---

- Description
  Run performance profiling on all SQL tables related to the booking engine.
  Apply new indexing strategies to the 'Trips' and 'Users' tables.
  Refactor the legacy query structure to ensure it is modern and follows best practices.

## VBS-502

- Key: VBS-502

- Summary
  As a Passenger, I want the app to play a 30-second unskippable video advertisement every time I click the 'Confirm Booking' button so that I can be entertained while waiting for a driver.

---

- Description
  Trigger a high-volume video ad immediately upon booking confirmation.
  The 'Close' button must be hidden until the entire media file has finished playing.
  This must occur even in emergency or high-priority booking scenarios to ensure maximum ad impressions.

# Not Estimable User Stories

## VBS-701

- Key: VBS-701

- Summary
  As a System Administrator, I want to migrate the entire booking logic to a decentralized blockchain ledger so that we ensure absolute transparency.

---

- Description
  Research and implement a distributed ledger technology to replace the current SQL-based booking flow.
  Ensure smart contracts handle fare distribution automatically.
  The system must remain 100% compatible with existing mobile clients during the transition.

## VBS-702

- Key: VBS-702

- Summary
  As a Product Owner, I want the app to be extremely fast and highly responsive across all global regions so that users never experience lag.

---

- Description
  Optimize the backend architecture to support unlimited concurrent users globally.
  Latency must be reduced to the theoretical minimum for all API calls.
  The team should fix all 'bottlenecks' regardless of where they exist in the current infrastructure.

# Not Small User Stories

## VBS-601

- Key: VBS-601

- Summary
  As a Passenger, I want a complete profile management system so that I can control all my data and settings.

---

- Description
  Users can upload photos, change passwords, and manage multiple credit cards.
  Include a history tab showing all past 5 years of trips with PDF export functionality.
  Allow users to set favorites, manage notification preferences, and delete their entire account data.

## VBS-602

- Key: VBS-602

- Summary
  As a Product Owner, I want to launch the Driver Onboarding and Rewards Module so that we can scale our fleet.

---

- Description
  Implement a multi-step document upload for driver licenses, insurance, and vehicle inspections.
  Build a real-time background check integration with third-party providers.
  Develop a gamified rewards dashboard with weekly progress bars, referral bonuses, and tier-based payouts.
