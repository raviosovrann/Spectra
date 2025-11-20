# Simplified Auth (Username/Email + Password)

This flow uses a standard HTTP Session (or a simple Token).

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Frontend
    participant API as Backend API
    participant DB as Database

    %% SIGNUP
    rect rgb(240, 248, 255)
    Note over User, DB: 1. SIGNUP (Fast & Simple)
    User->>Client: Enters Username, Email, Password
    Client->>API: POST /signup
    API->>DB: Check if Username OR Email exists
    alt Exists
        API-->>Client: Error: "User already exists"
    else Available
        API->>API: Hash Password (Bcrypt)
        API->>DB: INSERT User
        API-->>Client: Success (User Created)
    end
    end

    %% LOGIN
    rect rgb(255, 250, 240)
    Note over User, DB: 2. LOGIN (Email OR Username)
    User->>Client: Enters "Identifier" + Password
    Client->>API: POST /login
    API->>DB: Find User WHERE email=id OR username=id
    
    alt User Not Found OR Bad Password
        API-->>Client: Error: "Invalid credentials"
    else Valid
        API->>API: Create Session / Sign JWT
        API-->>Client: 200 OK (Set-Cookie: session_id)
        Note right of Client: Browser automatically<br/>handles the cookie
    end
    end

    %% LOGOUT
    rect rgb(255, 240, 245)
    Note over User, DB: 3. LOGOUT
    User->>Client: Clicks Logout
    Client->>API: POST /logout
    API-->>Client: 200 OK (Set-Cookie: session_id=deleted)
    end