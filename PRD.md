# Backend Project Architecture Template (PRD)

## Problem Statement
Every year, countless students struggle at the end of their leases and have to find subletters for their apartments due to the lack of resources and a centralized, reliable tool to find potential sublets.

## Core Functionality
A website (eventually a mobile app) that acts as a closed-network housing marketplace connecting Purdue students to safely list, find, and secure subleases.

---

## List of Features

### Feature A: Advanced Sublease Search and Filtering
Allows prospective subletters to search and refine available apartment listings using filters such as distance, time, location, number of bedrooms, and amenities, directly connecting them to relevant housing options within the Purdue network.

### Feature B: Multi-Photo Panoramic Apartment Preview
Enables listers to upload multiple interior photos of their apartment, which are stitched or organized into an interactive panoramic viewing experience that allows prospective subletters to navigate and explore each room in a seamless 360-style interface, providing a realistic and immersive way to remotely evaluate listings and improve decision-making confidence.

### Feature C: Private In-App Messaging and Communication Platform
A secure in-app messaging system enabling subleasers and subletters to communicate directly within the platform, integrating negotiation and coordination into listings and allowing users to optionally exchange contact details once mutual agreement is reached.

### Feature D: LLM-Powered Recommendation Chatbot
An LLM-based chatbot that processes user queries (text or voice) and provides personalized apartment recommendations from the database, improving discovery through intelligent, tailored suggestions.

### Feature E: Tinder-Style Apartment Discovery Interface
An interactive swipe-based interface where users can browse listings, swipe left to dismiss and right to like apartments, with collected preference data used to improve recommendations and market insights.

---

## Implementation for Each Feature (High-Level Architecture)

### Feature A Implementation
**Technology Stack:** TBD (Backend + Database + Search Engine)  
**Data Models:** Listings, Users, Filters, Amenities  
**Logic Flow:** User query → filter processing → database/search engine query → ranked results → UI response  

---

### Feature B Implementation
**Technology Stack:** TBD (Panoramic View service + frontend viewer)  
**Integrations:** Image processing / photogrammetry pipeline  
**Security:** Authenticated uploads, access-controlled model viewing  

---

### Feature C Implementation
**Technology Stack:** TBD (WebSockets or real-time messaging service)  
**Integrations:** Real-time messaging backend (e.g., WebSocket server, Firebase, or similar)  
**Security:** Authenticated user-to-user messaging, encrypted transport (TLS), access control per listing/match  

---

### Feature D Implementation
**Technology Stack:** TBD (LLM API + backend orchestration layer)  
**Data Models:** User queries, embeddings (optional), listings metadata  
**Logic Flow:** User input → LLM processing → database retrieval → ranked recommendations → response generation  

---

### Feature E Implementation
**Technology Stack:** TBD (Frontend swipe UI + recommendation backend)  
**Data Models:** User swipes, preferences, listing interactions  
**Logic Flow:** Swipe input → preference logging → recommendation model update → personalized feed generation  
