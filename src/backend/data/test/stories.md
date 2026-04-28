**[VBS-1]** As a Passenger, I want to cancel my trip at any time before the driver arrives so that I have maximum flexibility.
Description: Passengers can cancel a booking without penalty until the driver is within 100 meters of the pickup point.
No cancellation fees shall be applied if the trip has not started.
System must update trip status to 'Cancelled' immediately upon request.

---
**[VBS-2]** As a Driver, I want to receive a cancellation fee if the passenger cancels after 2 minutes of booking so that my time is compensated.
Description: If a passenger cancels more than 120 seconds after the initial booking, a flat $5 fee is charged.
Cancellation is blocked if the driver is already en route for more than 5 minutes.
This rule applies regardless of the driver's current distance from the passenger.

---
**[VBS-3]** As a Passenger, I want to chat with the driver via an in-app messenger so that I can provide specific pickup instructions.
Description: The system must support real-time text messaging between assigned parties.
Messages must be stored permanently in the database for safety audits.
Chat remains active for 24 hours after the trip is completed.

---
**[VBS-301]** As a Passenger, I want to book a ride by entering my destination so that a driver can find me.
Description: The user enters a destination address in the search bar.
The system calculates the estimated fare and shows available vehicle types.
Upon clicking 'Confirm,' the system searches for the nearest available driver.

---
**[VBS-302]** As a User, I want to request a vehicle to a specific location so that I can travel to my destination.
Description: Users provide a drop-off point and see a list of cars nearby.
The app displays the price for the trip before the user confirms the request.
Matching logic initiates to find a driver once the user submits the booking.

---
**[VBS-4]** As a System Administrator, I want to protect user privacy by preventing any direct communication between users so that we avoid off-platform transactions.
Description: All communication must be routed through automated IVR phone masking only.
No text-based messaging or storage of chat logs is permitted to comply with strict data privacy laws.
Any active communication channel must be destroyed immediately once the trip status is 'Completed'.

---
**[VBS-401]** As a Passenger, I want to pay for my ride using a Credit Card so that the transaction is cashless.
Description: Integrate the Stripe payment gateway to handle Visa and Mastercard transactions.
Store a tokenized version of the card for future use.
Execute the charge automatically when the driver clicks 'End Trip'.

---
**[VBS-402]** As a System, I want to process automated payments at the end of a journey so that drivers get paid promptly.
Description: Trigger a payment request to the external gateway (Stripe) once a ride is completed.
The system should support all major credit card providers.
Ensure the transaction status is updated in the billing ledger immediately.

---
**[VBS-501]** As a Developer, I want to optimize the database indexes so that the system runs better.
Description: Run performance profiling on all SQL tables related to the booking engine.
Apply new indexing strategies to the 'Trips' and 'Users' tables.
Refactor the legacy query structure to ensure it is modern and follows best practices.

---
**[VBS-502]** As a Passenger, I want the app to play a 30-second unskippable video advertisement every time I click the 'Confirm Booking' button so that I can be entertained while waiting for a driver.
Description: Trigger a high-volume video ad immediately upon booking confirmation.
The 'Close' button must be hidden until the entire media file has finished playing.
This must occur even in emergency or high-priority booking scenarios to ensure maximum ad impressions.

---
**[VBS-601]** As a Passenger, I want a complete profile management system so that I can control all my data and settings.
Description: Users can upload photos, change passwords, and manage multiple credit cards.
Include a history tab showing all past 5 years of trips with PDF export functionality.
Allow users to set favorites, manage notification preferences, and delete their entire account data.

---
**[VBS-602]** As a Product Owner, I want to launch the Driver Onboarding and Rewards Module so that we can scale our fleet.
Description: Implement a multi-step document upload for driver licenses, insurance, and vehicle inspections.
Build a real-time background check integration with third-party providers.
Develop a gamified rewards dashboard with weekly progress bars, referral bonuses, and tier-based payouts.

---
**[VBS-701]** As a System Administrator, I want to migrate the entire booking logic to a decentralized blockchain ledger so that we ensure absolute transparency.
Description: Research and implement a distributed ledger technology to replace the current SQL-based booking flow.
Ensure smart contracts handle fare distribution automatically.
The system must remain 100% compatible with existing mobile clients during the transition.

---
**[VBS-702]** As a Product Owner, I want the app to be extremely fast and highly responsive across all global regions so that users never experience lag.
Description: Optimize the backend architecture to support unlimited concurrent users globally.
Latency must be reduced to the theoretical minimum for all API calls.
The team should fix all 'bottlenecks' regardless of where they exist in the current infrastructure.

---
**[VBS-801]** As a Passenger, I want to receive a digital tax receipt via email so that I can track my business expenses.
Description: This story is strictly blocked by VBS-401; do not start until the Stripe integration is finished.
The receipt must pull the specific transaction ID and card masking details generated in VBS-401.
Automatically trigger the email only after the payment status is confirmed as 'Succeeded'.

---
**[VBS-802]** As a Driver, I want to view my 'Verification Badge' on my profile so that passengers trust my credentials.
Description: The badge only appears if the background check from VBS-602 returns a 'Clear' status.
This feature relies on the document upload UI being fully operational as defined in VBS-602.
If the background check is pending, the badge must remain invisible to the user.

---
**[VBS-803]** As a Passenger, I want to save 'Home' and 'Work' locations so that I can book rides faster.
Description: Users can long-press a location on the map to save it as a favorite.
Provide a 'Favorites' shortcut menu on the main booking screen.
Limit the number of saved locations to 5 per user account.

---
**[VBS-804]** As a Driver, I want to switch my status to 'Offline' so that I stop receiving ride requests when I am finished working.
Description: Add a toggle switch on the driver dashboard for 'Online/Offline' status.
When offline, the driver's location is no longer tracked by the matching engine.
Show a confirmation toast message when the status changes successfully.

---
**[VBS-805]** As a User, I want to be a driver
Description: Users can sign up to become drivers by providing necessary documents and information.
The system verifies the driver's credentials before allowing them to accept ride requests.
Drivers can set their availability status to 'Online' or 'Offline' in the app.

---
**[VBS-806]** As a Passenger, I want to rate my driver from 1 to 5 stars after the trip so that I can provide feedback on the service.
Description: Show a rating pop-up immediately after the trip status changes to 'Completed'.
Allow users to select optional tags like 'Clean Car' or 'Professional Driver'.
Calculate and update the driver's average rating in the database upon submission.
