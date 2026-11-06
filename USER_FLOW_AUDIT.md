# User Flow Audit — Fold Fox Laundry POS

**Date:** 2026-10-15
**Code state:** commit `cbceb6a`, plus the uncommitted clothing-category changes.
**Method:** each user flow was traced end to end through the code: screen → service/hook → `api.js` → route → middleware → controller → model → response → back to the screen. This was a static read; no flows were clicked through in a browser. The most serious findings were re-checked by hand against the source.

Paths: **FE** = `Laundary-POS-System-Frontend/src`, **BE** = `Laundary-POS-System-Backend/src`.

---

## Summary

| Severity | Count | Meaning |
|---|---|---|
| 🔴 Blocker | 12 | A core flow can't be completed, or it silently produces a wrong result |
| 🟠 Major | 48 | Wrong money or data, a security hole, or a seriously broken screen |
| 🟡 Minor | 58 entries (some bundle related issues) | Degraded experience; a workaround exists |
| ⚪ Cosmetic | 10 groups | Visual or text problems |

### Flow health at a glance

| Flow | Status |
|---|---|
| Log in / log out | ⚠️ Correct credentials work. A **wrong password shows no error**. |
| Edit own profile | ❌ Can't save without typing a phone number, and the phone number is never stored anyway |
| Landing-page self-registration | ✅ Works. Discount rules can be abused (expired campaign codes, unverified student IDs). |
| Customers: create / edit / search | ⚠️ Works with many rough edges. Valid emails are rejected; student status can't be removed. |
| Create walk-in order | ⚠️ Works. Only 10 services are listed, no price summary is shown, and the confirmation email never arrives. |
| Create pickup order → confirm items | ⚠️ Works. Can be bypassed by changing status first, and the confirmation email never arrives. |
| Edit order | ❌ Balance, discount and fees are wrong after editing. Switching pickup to walk-in gets the order stuck. |
| Status progression | ⚠️ Works. The phase badge drifts out of sync. |
| Take payment | ❌ Fails with quick-add extras or with 3+ extras. No partial payments. |
| Print / email receipt | ⚠️ Print works. Header is blank locally (missing env vars), and the email has `undefined` fields. |
| Delete order | ❌ Admin can't delete a paid order from the UI |
| Services admin | ⚠️ CRUD works. Bulk actions always fail; analytics always show 0. |
| Staff admin | ❌ Only the 10 newest staff are visible; analytics are empty |
| Users admin | ⚠️ CRUD works. The page re-renders in a loop, and an admin can lock themselves out. |
| Dashboard | ❌ Recent Orders is always empty and Total Customers is always 0 |
| Reports | ❌ Order Status report is one "Unknown" bucket; end dates are cut off; revenue is defined differently on every tab |
| Excel export | ✅ Works |

---

## 🔴 Blockers

| ID | Flow | What the user experiences | Root cause | Fix |
|---|---|---|---|---|
| B1 | Login | A wrong password or a deactivated account shows a full-screen spinner, then a blank form with **no error message**. The "attempts left" warning and the 5-try lockout never trigger. | `login()` sets the global `isLoading` (FE `context/AuthContext.jsx:142`), so `PublicRoute` swaps Login out for a spinner (`components/ProtectedRoute.jsx:46`). When the form remounts, the error is cleared (`pages/Auth/Login.jsx:51-53`) and the attempt counter is reset. | Use a local "submitting" flag in Login instead of the global `isLoading`. |
| B2 | Edit profile | "Update Profile" fails with "Please enter a valid phone number" unless a phone is typed. The field is always empty because the API never returns a phone. | The yup `.matches()` call lacks `excludeEmptyString` (FE `components/modals/ProfileModal.jsx:31-34`). | Add `{ excludeEmptyString: true }`. |
| B3 | Payment | After adding a Quick Add extra (hanger, bag…), totals show **LKR NaN** and Complete Payment fails. | The quick-add templates have no `quantity` (FE `components/orders/PaymentModal.jsx:15-22, 77`), so `price × undefined` is NaN. | Add `quantity: 1` when adding an extra. |
| B4 | Payment | Payment fails with a generic error once the notes exceed 100 characters, which usually happens with 3 or more extra items. | Each extra item is appended to the payment notes (`PaymentModal.jsx:141-147`), and payment notes are capped at 100 characters (BE `models/Order.js:73`). | Send extras only in `extraCharges`, or raise the limit. |
| B5 | Order emails | **"Order Confirmed" emails are never sent**, for walk-in orders or after pickup items are confirmed. The UI still says "customer notified via email". | `formatPlainCurrency` and `formatEstimatedTime` are defined inside `sendBankAccountDetails` (BE `services/notificationService.js:150`) but used in `sendOrderConfirmation` (`:473, :613`). The resulting ReferenceError is caught and ignored. | Move both helpers to module scope, and check the email result. |
| B6 | Edit order | After editing items, **the balance due still reflects the old total**. Payment status, the paid/unpaid filters and the amount collected are all wrong. | The first pre-save hook sets `balanceAmount` (BE `models/Order.js:387`) before the second hook recalculates `totalAmount` (`:396-411`). | Compute the balance after the totals, in the same hook. |
| B7 | Edit order | A draft pickup order edited to "no pickup" can never be confirmed. It stays in draft with status `pickup` forever. | `pickupRequired` is assigned without moving the phase or status (BE `controllers/orderController.js:691`). `canConfirm` then rejects non-pickup orders (`models/Order.js:634`). | Block changing `pickupRequired` on edit, or transition the order correctly. |
| B8 | Create order | **Only the first 10 services (A–Z) appear** in the service dropdown, and inactive services appear and can be ordered. | `useServices()` is called with no params (FE `pages/OrderFormPage.jsx:103`), so the backend default `limit=10` applies with no `isActive` filter (BE `controllers/serviceController.js:191`). | Use `useServices({ isActive: true, limit: 100 })`, and reject inactive services in `createOrder`. |
| B9 | Delete order | An admin deleting a paid or in-progress order confirms twice ("will remove all payment records") and is then **refused by the server** ("use force=true"). | The frontend never sends `force` (FE `services/api.js:118`). The backend checks at BE `orderController.js:910, 919`. | Send `?force=true` after the second confirmation. Also fix `force=false` being truthy (`:897`). |
| B10 | Reports | The Order Status report, its chart and its Excel export put **every order in one "Unknown" bucket**. | The report groups by `'$orderStatus'`, but the field is `status` (BE `controllers/reportController.js:187, 447`). | Group by `'$status'`. |
| B11 | Services admin | **Every bulk activate/deactivate/delete fails** with "Failed to update service". | `PUT /:id` is declared before `PUT /bulk-update` (BE `routes/services.js:64, 67`). The customers route has the same bug (`routes/customers.js:78, 81`). | Move `/bulk-update` above `/:id` in both routers. |
| B12 | Staff admin | **Only the 10 newest staff are visible.** Search, sort, paging and the stat cards only cover those 10. | `getAllStaff()` sends no params (FE `services/staffService.js:13`), and the backend defaults to `limit=10` (BE `controllers/staffController.js:160`). | Send a limit, or use server-side paging and search. |

---

## 🟠 Major

### Money, pricing and discounts

| ID | Flow | Problem | Where | Fix |
|---|---|---|---|---|
| M1 | Edit order | Editing items keeps the **old discount amount**, so totals can go wrong or negative (which gives a 500). Toggling Express doesn't add or remove the LKR 100 fee. Unticking pickup or delivery still bills the old custom charge. | BE `orderController.js:564-692`, `models/Order.js:407` | Recompute discount, express fee and charges in `updateOrder`. |
| M2 | Edit order | Unpaid walk-in orders stay editable at any status, even `washing` or `complete`. | BE `models/Order.js:600-623` | Block edits when status is past `received`. |
| M3 | Create order | No subtotal, discount or total is shown before Create, so a cashier can't quote a price. The 20% campaign discount is never shown. The student banner promises 10% even when 20% applies or the customer isn't eligible. | FE `OrderFormPage.jsx:556-575, 848-1080` | Add a totals panel backed by `GET /customers/:id/discount-info`. |
| M4 | Create order | Choosing "Add Custom Price" for pickup and leaving it blank **silently charges LKR 50**. | FE `OrderFormPage.jsx:286-288` → BE `orderController.js:254-256` | Require a value; default the backend to 0. |
| M5 | Create order, price calculator | The category dropdown lists **every** category, including ones the service has no price for. The preview shows LKR 0, then the backend rejects with "No price found". | FE `OrderFormPage.jsx:740`, `components/services/PriceCalculator.jsx:214-223` | List only the categories in `service.clothingPrices`, and default to the first. |
| M6 | Loyalty | Points are credited **when the order is created**, before payment and on the estimated total. Confirming or editing never adjusts them, and deleting reverses a different number, so balances drift. `totalSpent` includes unpaid orders. `loyaltyPointsUsed` is unchecked and never reduces the price. | BE `orderController.js:327, 341-347, 938-945, 1293` | Credit points on payment or completion; adjust them on confirm and edit. |
| M7 | Create order | Order numbers (`FL`+date+last 6 digits of `Date.now()`) **can collide**, which fails with a generic 500. | BE `models/Order.js:382-383` | Use a daily counter, or retry on a duplicate key. |
| M8 | Create pickup order | The pickup email is sent **before** the API responds. A slow mail server exceeds the 10 s timeout, the UI says "Failed", and a retry creates a **duplicate order**. | BE `orderController.js:362`, FE `api.js:7` | Send emails after responding. |
| M9 | Payment | **Partial payments are impossible.** Every payment is the full balance plus extras. | FE `PaymentModal.jsx:156, 176` (the amount field is never shown) | Show an amount input (≤ balance). |
| M10 | Payment (API) | `addPayment` accepts overpayment, counts `status:'pending'` payments as paid, and trusts the client's extras total. | BE `orderController.js:793, 830, 840-849` | Validate `0 < amount ≤ balance` and recompute extras on the server. |
| M11 | Status | A **pickup order can be moved to washing without confirming items**. Confirm Items then disappears and the order stays "Draft" forever, editable and priced on estimates. | FE `components/orders/OrderStatusManager.jsx:200-207`, BE `orderController.js:716-765` | Block statuses past `received` until items are confirmed. |
| M12 | Status / payment | The **phase badge drifts**. An unpaid order taken to complete stays "Confirmed". Paying after completion leaves it "Processing" forever. | BE `orderController.js:769, 852` | Derive the phase from items-confirmed, paid amount and status in one helper. |
| M13 | Landing / discounts | The **ended campaign code still gives 20%** to anyone who POSTs it. The campaign dates are only checked in the browser. | BE `controllers/customerController.js:855-859` | Move campaign dates to the backend and enforce them. |
| M14 | Landing / discounts | **Any non-empty student ID** (e.g. "X") gets 10% off every order forever. The review step says "Student status verified". | FE `components/landing/PopupRegistrationForm.jsx:87, 423`, BE `middleware/registrationValidation.js:113-123` | Validate the format; mark the student as pending until staff verify. |
| M15 | Edit customer | **Unticking "is student" does nothing**, so the customer keeps 10% off. | FE `CustomerFormPage.jsx:330` keeps the hidden `campusId`; BE `customerController.js:243` uses `isStudent = !!(campusId \|\| isStudent)` | Clear `campusId` on untick, and honour the explicit flag. |

### Wrong numbers on dashboards and reports

| ID | Flow | Problem | Where | Fix |
|---|---|---|---|---|
| M16 | Dashboard | **Recent Orders is always empty.** | FE `pages/Dashboard.jsx:64` reads `data.orders`; the backend returns `data.data.orders` | Read `data.data.orders`, and use `order.status` (`:69`). |
| M17 | Dashboard | **Total Customers is always 0.** | BE `reportController.js:55` filters on `isActive`, which Customer doesn't have | Count without the filter. |
| M18 | Orders page | "In Progress", "Ready" and "Today's Revenue" **always show 0**. "Pending" means *unpaid* here but *not delivered* on the Dashboard. | FE `pages/Orders.jsx:144-173`, BE `models/Order.js:443-471` | Return the real counts and use one definition of "pending". |
| M19 | Reports | The end date cuts off everything after 05:30 Sri Lanka time. A same-day range is nearly empty, and day/month buckets use UTC days. | BE `reportController.js:101, 179, 215, 273…`, `:113-136` | Use `< endDate + 1 day` in `Asia/Colombo` and pass `timezone` to the date operators. |
| M20 | Revenue report | Weekly rows come out in random order. | BE `reportController.js:149, 371` (no `_id.week` in the sort) | Sort by year then week. |
| M21 | Revenue report | Switching Daily/Weekly/Monthly without clicking Apply mislabels the data (e.g. "2026-Wundefined"). | FE `components/reports/RevenueReport.jsx:71-79` | Store the `groupBy` that was applied with the data. |
| M22 | Service report | Order count, "Total Orders" and "Avg/Order" count **line items as orders**. | BE `reportController.js:296, 625` | Count distinct order IDs. |
| M23 | All reports | **Revenue means something different on every tab**: paid orders only, all orders, item prices before fees and discount, and the Orders page's own figure. | BE `reportController.js:94, 210, 268`, `models/Order.js:450` | Agree on one definition, and exclude deleted orders everywhere. |
| M24 | Customers analytics tab | Total Revenue is always 0, growth is always "0%", the time-range selector does nothing, the Top Loyalty and Growth panels are always empty, and the insights are hard-coded. | FE `components/customers/CustomerAnalytics.jsx:51-78, 218-273` vs BE `customerController.js:744-755` | Map the real fields; remove the fake ones. |
| M25 | Service details | Service analytics **always show 0 orders and LKR 0**. | BE `serviceController.js:585, 592` (string id in an aggregate, never cast to ObjectId) | Use `new mongoose.Types.ObjectId(id)`. |
| M26 | Staff analytics | The analytics tab shows all zeros. | FE `pages/Staff.jsx:245` passes list data; no stats endpoint exists | Add `/staff/stats`, or compute from the list. |

### Security and access

| ID | Problem | Where | Fix |
|---|---|---|---|
| M27 | **Anyone can create a cashier account** via the public `POST /api/auth/register`, which has no rate limit. Cashiers have full customer and order access. | BE `routes/auth.js:24`, `authController.js:49-54` | Remove the route, or require an admin. |
| M28 | **Order update accepts any field** (`paidAmount`, `status`, `payments`, `isDeleted`, `discount`…) and trusts item prices that are sent in. | BE `orderController.js:597-614, 691` | Whitelist editable fields; always re-price on the server. |
| M29 | **Customer create/update accepts any field**: loyalty points, `totalSpent`, and the 20% campaign flag. The edit form itself resends `loyaltyPoints`. | BE `customerController.js:18, 240`, FE `CustomerFormPage.jsx:284-296` | Whitelist fields; remove points from the form. |
| M30 | **Cashiers can permanently delete customers.** Their orders are left without a customer; confirming one of those orders then fails with a 500. The modal claims the order history is deleted, which isn't true. | BE `routes/customers.js:84`, `customerController.js:302`, `orderController.js:1220` | Make it admin-only, use soft delete, and block deletion while orders exist. |
| M31 | **An admin can demote or deactivate themselves** in the edit form, and can end up with zero admins. | BE `userController.js:251-267` | Block self role/active changes; always keep at least one admin. |
| M32 | **Rate limits can be bypassed** by sending a fake `X-Forwarded-For` header (login and registration). | BE `middleware/rateLimitConfig.js:50, 141` | Key on `req.ip` with `ipKeyGenerator`. |
| M33 | **In production, a shop on one IP is capped at 50 requests per 15 min** across the whole API, login included. | BE `app.js:114-123` | Remove or raise the global production limiter. |
| M34 | The login page shows **demo credentials**. | FE `pages/Auth/Login.jsx:312-339` | Remove them from the production build. |
| M35 | If `JWT_REFRESH_SECRET` is unset, a 7-day refresh token works as an access token. *(Latent: the local `.env` sets it; production is unverified.)* | BE `authController.js:13`, `middleware/auth.js:17` | Reject `type:'refresh'` tokens in `authenticateToken`. |

### Broken screens and UX

| ID | Flow | Problem | Where | Fix |
|---|---|---|---|---|
| M36 | Session | **A backend blip (500 or timeout) during page load logs the user out** permanently. | FE `AuthContext.jsx:127-131` | Clear tokens only on a 401 or a failed refresh. |
| M37 | Profile, Users | The **phone number is silently discarded** in both the profile and the user create/edit forms, though they report "updated successfully". | BE `authController.js:165-170`, `userController.js:138, 251` | Save and return `phoneNumber`, or remove the fields. |
| M38 | Users admin | **The Users page re-renders in an endless loop** once users load, pegging the CPU. | FE `pages/Users.jsx:83-85` ↔ `components/users/UserList.jsx:74-85` | Wrap the callback in `useCallback`, or use `/users/stats`. |
| M39 | Customers → order | After "Create Order", pressing **Back on the order form bounces straight back**, endlessly. | FE `pages/Orders.jsx:30-34` | `navigate('/orders/new', { state, replace: true })`. |
| M40 | Customers, Services, Staff | In **grid view, Edit/Delete/Duplicate buttons are invisible but still clickable**, so a click can open delete or edit without the user seeing it. | FE `CustomerList.jsx:363/446`, `ServiceList.jsx:377/488`, `StaffList.jsx:229/295` | Add the `group` class to each card. |
| M41 | Customers | The grid view has **no pagination**, so only the first 10 customers are reachable. | FE `CustomerList.jsx:639` | Move pagination below both views. |
| M42 | Customers | When a search term is entered, the type filter, sort and paging are ignored and **at most 10 matches** show. Students show as "Regular". | FE `CustomerList.jsx:68-72`, BE `customerController.js:782-792` | Use `getCustomers` with `search`. |
| M43 | Customers | **Backend failures are hidden.** The list shows the empty state, and a failed delete closes the modal as if it worked. | FE `services/customerService.js` (returns `{success:false}` instead of throwing) | Throw from the service, or check `result.success`. |
| M44 | Customers | Valid emails like `name+1@gmail.com` or `x@company.info` **fail to save** with a generic error. The same happens on landing-page registration. | BE `models/Customer.js:45`, `middleware/registrationValidation.js:57` | Use one permissive validator (`validator.isEmail`) everywhere. |
| M45 | Customers | The Save button has **no loading/disabled state**, so a double-click submits twice. | FE `CustomerFormPage.jsx:155, 164-165` | Use `mutation.isPending`. |
| M46 | Services admin | **Typing in the service search loses focus after each character**, because the whole list flashes to a spinner. | FE `ServiceList.jsx:177` | `placeholderData: keepPreviousData` and a debounce. |
| M47 | Create order | Adding a second item without picking a service gives only "Validation failed", with no field highlighted. | FE `OrderFormPage.jsx:838`, BE `middleware/validation.js:8` | `trigger('items')` before step 3; show the first error message. |
| M48 | Landing | On shared campus Wi-Fi, the **6th student within 15 minutes is blocked** (5 per IP), and auto-retries use up those slots. | BE `rateLimitConfig.js:18-19` | Key on IP + phone; don't count failed attempts. |

---

## 🟡 Minor

**Auth & session**
- "Remember me" unchecked still keeps the user logged in; it only changes the access token from 24h to 30d (`AuthContext.jsx:148`).
- The rotated refresh token is discarded, so sessions die 7 days after login even when active (`api.js:46`).
- The React Query cache isn't cleared on logout, so the next user can briefly see the previous user's data.
- The cashier "New Order" sidebar link opens the Orders list (`Sidebar.jsx:108`). Dashboard "Create Order"/"Add Customer" do the same (`Dashboard.jsx:162, 170`).
- "Forgot password?" goes nowhere. The Header "Settings" item does nothing.
- Changing email to one already in use shows a generic error (500 instead of 400).
- Change-password is limited to 3 per hour, **including successful attempts**.
- Password show/hide eye icons never render, because `ui/Input` ignores `leftIcon`/`rightIcon`.
- Inputs never show red error borders or focus borders, because `cn()` receives an object (`ui/Input.jsx:14-21`).

**Landing**
- The "Try Again" button never appears; the error-message keywords it looks for are never present (`ErrorModal.jsx:20-23`).
- Phone numbers with spaces pass step 2 but are rejected after step 5. "+94…" and "0…" create duplicate customers.
- Reopening the popup after a successful registration shows the old success screen.
- With a pickup order pending, a walk-in order can take the 20% campaign discount, and the pickup estimate then drops it.
- The campaign config is expired (ended 2025-12-31), so the site shows no offer. Dates are parsed as UTC.
- "Contact Support" leaves the popup open with scroll locked. The map pin points at SLIIT, not the shop. Instagram links to `#`. The email card is blank if `VITE_BUSINESS_EMAIL` is unset.

**Customers**
- Student-ID format errors show in red but don't block submit, because the field-level validate is ignored with yupResolver.
- Clearing a customer's email doesn't remove it.
- The Customers page "Quick Search" box does nothing. Closing the Loyalty modal clears the selection.
- The empty state always says "adjust filters" and never shows "Add Customer".
- Searching with `+`, `(` or `*` returns a backend 500 (unescaped regex).
- Loyalty: double-click applies the change twice; you can't set points to 0; the required "reason" is thrown away.
- Changing a customer's phone to one already in use gives a generic error.
- The Orders tab shows only the 10 newest orders. The Analytics tab covers only the last 30 days but is labelled "Total".
- After a delete, Quick Actions still holds the deleted customer.
- The table spinner flashes on every page change (`keepPreviousData` is the v4 option). The delete button shows no loading state.

**Orders & fulfilment**
- Editing any field, even the instructions, re-prices every item at current catalogue prices.
- Changing the customer while editing an order is silently ignored.
- Editing a confirmed first pickup order and re-confirming it drops its 20% campaign discount.
- There is no delivery-distance input, so the backend's distance charge can never apply.
- Every customer pick triggers two identical customer fetches.
- Confirm Items doesn't update the customer's `totalSpent`/points. Its preview can disagree with the saved total.
- Status can't be moved backwards to fix a misclick. If the status isn't in the timeline, only the first two steps are offered.
- The status "Update" and order delete buttons never show a pending state (`isLoading` is the v4 name; v5 uses `isPending`). Both success and error show two toasts.
- Staff notes past 500 characters make any further status update with a note fail.
- "New Balance" in the bank-transfer step always shows LKR 0. The modal's breakdown omits the express fee and extra charges.
- Row Print shows "Please select orders first" or nothing. Bulk Print and Export only log to the console.
- Print Receipt crashes silently when popups are blocked.
- The emailed receipt shows `undefined` business fields when `BUSINESS_*` is unset. `/send-receipt` will email any address.
- "Edit" shows on a draft pickup order that already has a payment, but the backend refuses it.
- In Order Analytics, "Completion Rate" is really paid ÷ total, and "Today" is a UTC date.
- **Local setup:** the frontend `.env` has only `VITE_API_URL`, so the receipt header, SMS text and bank-transfer details are blank or show "undefined".

**Admin**
- `BulkOperations` can never be opened, because `ServiceList` never calls `onBulkSelect`.
- On the Services page, "Most Popular" always shows N/A and "Avg Processing" always 0.
- On the Service stats tab, the period selector does nothing, and "Highest Revenue" and "Most Ordered" show the same service.
- Price calculator: double request on select, one request per keystroke, and the wrong price type for mixed services.
- ServiceFormPage step-1 rules (name length, description ≤200) are never enforced.
- Renaming a service to an existing name shows a generic error.
- **From the new custom-category feature:** deleting a custom category during service *creation* leaves its price in hidden state, and the price is still saved.
- Staff: the Active and On Leave cards are always 0; every error toast appears twice; backend validation shows only "Validation failed" (client allows age 16+, server requires 18+).
- Staff: 8 frontend methods call routes that don't exist (none are used by the UI).
- Users: stat cards count only the current page; search sends a request per keystroke and loses focus on 0 results.
- Users: the "can't delete or deactivate yourself" UI checks never match (`_id` vs `id`); the backend still blocks it.
- An admin changing their own password isn't asked for the current one. Names containing `.`, `'` or `-` are rejected with no field error.
- The password modal has no loading state, its password minimum is 6 while the strength meter wants 8, and the user's name is blank.

**Reports & dashboard**
- If the orders call fails, the Dashboard stats are wiped too (`Promise.all`).
- Order counts include soft-deleted orders; revenue doesn't.
- A report with only one date filled in returns all-time data.
- Excel exports use un-applied filter values. Large exports can hit the 10 s timeout.

---

## ⚪ Cosmetic (grouped)

- Fake "+12%" trend badges on the Dashboard. The cashier tip mentions keyboard shortcuts that don't exist.
- Status maps use old status names (`ready_for_pickup`, `delivered`), so Dashboard badges and Order Status report colours are grey.
- Tailwind classes that don't exist: `animate-fadeIn`, `border-b-3`, `border-3`, `xs:inline`, `to-blue/10`, `animate-slide-down`, `size="large"`.
- The description field is a single-line input. The StaffFormPage header is duplicated. The staff country default is India.
- Staff salary shows "LKR 50,000 LKR". The receipt has an empty "Pickup Date" row. The timeline "By:" is blank.
- Custom category labels show as title-cased keys on receipts and service details ("T Shirts Tops"). *(From the new category feature.)*
- The customer address shows the street twice. Stray "0"s appear in Loyalty and Analytics cards.
- The Hero highlight cards are never rendered. "Learn More" anchors don't exist. The mobile menu stays open behind the popup.
- Copy Info gives no feedback. The Confirmed SMS always says "Processing".
- Debug `console.log`s in controllers and components, including personal data.

---

## Corrections to the earlier `PROJECT_DOCUMENTATION.md`

Tracing whole flows showed that some earlier findings were wrong or overstated:

| Earlier claim | Correction |
|---|---|
| `invalidateQueries([key])` "doesn't work" in v5 | It **works but over-fetches**: an array with no `queryKey` matches every query, so screens do refresh. |
| `order.status.replace` / `payment.status.toUpperCase` / `user.role.charAt` crash | Not reachable: those fields have schema defaults. |
| Status timeline not populated | `getOrder` does populate `items.service.statuses`, and `OrderStatusManager` maps `wash → washing` correctly. |
| Auto-progress stalls | True in the backend, but the UI **never uses auto-progress**, so users don't hit it. |
| Excel export broken | Works: routes, blob download and token refresh are all fine. |
| CustomerSearch demo customers create bad orders | Backend validation blocks them; the user just sees "Validation failed". |
| Staff empty-email conflict | The frontend and backend both strip empty emails, so it isn't reachable from the UI. |

---

## Suggested fix order

1. **Do today. Revenue and trust are affected:**
   - B5 (confirmation emails)
   - B3 and B4 (payments fail)
   - B6 (wrong balance after edit)
   - B1 (login errors)
   - B2 (profile save)
2. **Security:**
   - M27 (public register)
   - M28 and M29 (mass assignment)
   - M13 and M14 (discount abuse)
   - M30 (cashier deletes customers)
   - M31 (admin lockout)
   - The leaked secrets in `ENV_FIX_SUMMARY.md` (from the earlier report)
3. **Core flow gaps:**
   - B7 (pickup→walk-in edit)
   - B8 (10-service limit)
   - B9 (admin can't delete paid orders)
   - B12 (10-staff limit)
   - M1 (edit totals)
   - M5 (category dropdown)
   - M9 (partial payments)
   - M11 and M12 (status bypass and phase drift)
4. **Numbers people make decisions on:**
   - B10 (Order Status report)
   - M16 and M17 (Dashboard)
   - M18 (Orders page cards)
   - M19 to M25 (reports and analytics)
5. **UX polish:** the rest of the Major list, then the Minor list.
