# Security Specification - Kwara Political Hangout (Admin)

## Data Invariants
1. A user can only access the admin console if their role is 'admin' or 'editor'.
2. Articles must have an authorId that matches an existing user with 'writer' or 'editor' role.
3. Only admins can delete articles or manage the staff registry.
4. Users cannot change their own roles.
5. All IDs must be strictly validated alphanumeric strings.

## The Dirty Dozen Payloads (Targeting users and articles)

1. **Identity Spoofing**: Attempting to create an article with someone else's `authorId`.
2. **Privilege Escalation**: Attempting to update own user document to set `role: 'admin'`.
3. **Ghost Field Injection**: Adding an `isVerified: true` field to an article submission.
4. **ID Poisoning**: Creating an article with a 2KB junk string as the document ID.
5. **State Shortcut**: Updating a 'draft' article directly to 'published' without being an editor.
6. **Denial of Wallet**: Submitting a 1MB string in the article `title` field.
7. **Orphaned Write**: Creating an article for a non-existent `category`.
8. **PII Leak**: Authenticated reader attempting to 'get' private user details from `users/{uid}`.
9. **Terminal State Bypass**: Attempting to update an 'archived' article.
10. **Timestamp Fraud**: Submitting a custom `createdAt` date from the client.
11. **Bulk Scrape**: Unauthorized user attempting to 'list' all `errorLogs`.
12. **Role Hijack**: A 'writer' attempting to use `demoteToWriter` logic via client SDK.

## Audit Checklist
| Attack Vector | Mitigation Logic |
|---|---|
| Identity Spoofing | `incoming().authorId == request.auth.uid` |
| Privilege Escalation | `!incoming().diff(existing()).affectedKeys().hasAny(['role', 'status'])` for users |
| Shadow Updates | `affectedKeys().hasOnly(['whitelisted_fields'])` |
| ID Poisoning | `isValidId(id)` helper with match regex |
| Denial of Wallet | `.size()` constraints on all strings |
| Terminal State | `existing().status != 'archived'` (or similar terminal state) |
