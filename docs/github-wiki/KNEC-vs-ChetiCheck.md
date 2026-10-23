# The Government Monopoly Myth (KNEC vs ChetiCheck)

A common assumption during hackathon evaluations is: *"The Kenyan Government already has KNEC and a national database, so why do we need ChetiCheck?"*

This assumption confuses two completely separate regulatory bodies in Kenya:

### Legal Jurisdiction in Kenya:
- **KNEC Jurisdiction**: Basic Education (Primary KCPE/KPSEA and Secondary KCSE). KNEC manages national high school exams and basic technical colleges.
- **University Jurisdiction**: Chartered Universities (Public & Private) operate autonomously under the **Universities Act (No. 42 of 2012)** and are regulated by the **Commission for University Education (CUE)**.
- **KNEC has zero jurisdiction, zero database records, and zero legal mandate over university degrees or postgraduate diplomas.**

### Comparison Table: KNEC QMIS vs ChetiCheck

| Dimension | KNEC QMIS (`qmis.knec.ac.ke`) | ChetiCheck Platform |
| :--- | :--- | :--- |
| **Target Sector** | Primary & Secondary (KCPE / KCSE) | **Higher Education Degrees, Diplomas, & Certificates** |
| **Verification Speed** | **10 to 14 working days** | **Under 200 milliseconds** (Instant) |
| **Cost to Verify** | **KES 2,280 – KES 2,320** per letter | **Free for graduate**, KES 250 for corporate HR API |
| **Offline Verification** | Zero (Requires internet & physical mail) | **100% Offline Capable** via client-side QR |
| **Tamper Resistance** | Paper letter (photoshoppable) | **Mathematical Ed25519 digital signatures** |
