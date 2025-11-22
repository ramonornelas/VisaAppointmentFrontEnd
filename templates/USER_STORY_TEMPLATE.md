# User Story Template

## User Story
**As** [user role],  
**I want** [goal/functionality]  
**So that** [benefit/reason].

## Flow Steps
1. [Step 1 description]
   - **Backend:** [API call or backend action]
   - **UI:** [User interface behavior]

2. [Step 2 description]
   - **Backend:** [API call or backend action]
   - **UI:** [User interface behavior]

[Continue with additional steps...]

## Acceptance Criteria

### [Criteria Group 1 Name]
**Given** [initial condition]  
**When** [action/trigger]  
**Then** [expected outcome]  
**And** [additional expected outcome]  
**And** [additional expected outcome]

### [Criteria Group 2 Name]
**Given** [initial condition]  
**When** [action/trigger]  
**Then** [expected outcome]  
**And** [additional expected outcome]

[Continue with additional criteria groups...]

## API Examples

### Example Request (JSON)
```json
{
  "field1": "value1",
  "field2": "value2",
  "items": [
    {
      "item_field1": "item_value1",
      "item_field2": "item_value2"
    }
  ]
}
```

### Example Success Response (JSON)
```json
{
  "status": "success",
  "message": "Success message",
  "data": {
    "result_field": "result_value"
  }
}
```

### Example Error Response (JSON)
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    { "field": "error_field", "reason": "Error reason" }
  ]
}
```

## Expected Data Schema (JSON)
```json
{
  "id": "string-uuid",
  "field1": "data_type",
  "field2": "data_type | null",
  "created_datetime": "ISO-8601-timestamp",
  "updated_datetime": "ISO-8601-timestamp"
}
```

---

## Notes
- Add any additional notes, constraints, or business rules here
- Include edge cases or special considerations
- Reference related user stories or dependencies

---

## Example: Physical Inventory Count User Story

### User Story
**As** Ana, a cashier using StellarPOS  
**I want** to record the actual counted quantity of products and product variants  
**So that** inventory stays accurate and aligned with physical counts at both levels.

### Flow Steps
1. Open the "Inventario/Conteo Físico" tab.
   - **Backend:** GET {BASE_URL}/products?with_stock=true → returns products and, for products with variants, their variants that have stock_available > 0.
   - **UI:** Renders one unified list of countable items:
     - Products without variants: one row per product.
     - Products with variants: one row per variant and a product row for reference as a grouping row.

2. Enter counted quantities per item (blind).
   - **Backend:** None (values are kept locally in the UI).
   - **UI:** Ana can freely edit/clear entries; no per-row status is shown.

3. Click "Continuar" to validate (dry-run).
   - **Backend:** POST {BASE_URL}/inventory/movements with { type: "count", mode: "validate", items: [...] }
     (Items include product_id and, when applicable, product_variant_id, plus the counted quantity).
     Response: needs_recount list of items (products or variants), IDs/labels only — no quantities or magnitudes.
   - **UI:**
     - If needs_recount is empty → proceed to Step 4.
     - If not empty → switch to Recount Mode (Step 5), showing only the flagged items.

4. If there are no differences, finish.
   - **Backend:** POST {BASE_URL}/inventory/movements with { type: "count", mode: "apply", recount_items: [...] } (only flagged items).
   - **UI:** Show success ("Conteo físico registrado correctamente"), clear the list, and start a new session.

5. If there are differences, perform a blind recount for flagged items only.
   - **Backend:** None (still local).
   - **UI:** Shows only items in needs_recount; Ana captures the second count; can edit within this subset before confirming. Still no per-row status is shown.

6. Click "Confirmar" to apply updates.
   - **Backend:** POST {BASE_URL}/inventory/movements with { type: "count", mode: "apply", recount_items: [...] } (only flagged items).
     - Creates inventory movements of type "count" only for items that differ.
     - Updates stock transactionally (all or none):
       - Product items (no variants): update POS_product.stock_available to the counted quantity.
       - Variant items: update POS_product_variant.stock_available to the counted quantity.
       - No recalculation of product stock from variant stock.
     - Response: Success message.

7. See success confirmation and start a new session.
   - **Backend:** None.
   - **UI:** Show success ("Conteo físico registrado correctamente"), clear the list, return to initial state.

### Acceptance Criteria

#### Auto-Load Products and Variants With Stock
**Given** Ana is on the "Inventario/Conteo Físico" tab  
**When** the screen loads  
**Then** the system calls GET {BASE_URL}/products?with_stock=true  
**And** displays a single list for counting where:
- Products without variants appear as product rows (if stock_available > 0).
- Products with variants appear as variant rows only (each variant with stock_available > 0).

#### Enter Counted Quantities (Blind)
**Given** the unified list is visible  
**When** Ana enters the counted quantity for any item (product or variant)  
**Then** Ana can freely edit or clear entries before continuing  
**And** the system does not display the system quantity  
**And** the system does not display a per-row status.

#### Validate Counts and Request Recount
**Given** Ana has finished entering initial counts  
**When** she clicks the "Continuar" button  
**Then** the system calls POST {BASE_URL}/inventory/movements with type = "count" and mode = "validate", including the captured counts (products with product_id; variants with product_id and product_variant_id)  
**And** if there are no differences, the system calls POST {BASE_URL}/inventory/movements with type = "count" and mode = "apply", including the captured counts (products with product_id; variants with product_id and product_variant_id) and displays a success message ("Conteo físico registrado correctamente") and clears the list for a new session  
**And** if there are differences, the system returns a list of items (products or variants) that require recount (without revealing any quantities or magnitudes)  
**And** the UI switches to Recount Mode, showing only those flagged items and disabling navigation back to the full list.

#### Recount Only for Flagged Items
**Given** the backend indicated items that require recount  
**When** Ana enters the recounted quantity for each flagged item  
**Then** the system allows editing within Recount Mode until confirmation  
**And** the system still does not reveal the system quantity or per-row match status.

#### Confirm and Apply via API
**Given** Ana has finished entering the recounts for all flagged items  
**When** she clicks the "Confirmar" button  
**Then** the system calls POST {BASE_URL}/inventory/movements with type = "count" and mode = "apply", including only the flagged items that were recounted  
**And** the backend creates inventory movements of type "count" only for items that differ  
**And** the backend updates stock transactionally (all or none) as follows:
- For product items (no variants): update POS_product.stock_available to the counted quantity.
- For variant items: update POS_product_variant.stock_available to the counted quantity.  
**And** the system displays a success message ("Conteo físico registrado correctamente")  
**And** the UI clears the list for a new session.

### API Examples

#### Example Request (JSON) — Apply Addition
```json
{
  "movement_type": "addition",
  "apply": true,
  "notes": "Restock from supplier",
  "user_id": "7cff08d3-510f-4e57-87d3-6785cb5fa1a7",
  "items": [
    {
      "product_id": "fd187a5a-471f-4a19-80a4-200e6b33d8be",
      "product_variant_id": null,
      "quantity": 10
    },
    {
      "product_id": "a29ffbc1-1c25-46c8-9dc1-b67839b1e0d4",
      "product_variant_id": "a29ffbc1-1c25-46c8-9dc1-b67839b1e0d4-v1",
      "quantity": 5.4
    }
  ]
}
```

#### Example Success Response (JSON) — Apply
```json
{
  "status": "success",
  "applied": true,
  "run_id": "f6a6e1d0-6f7a-4b3e-9c1f-2c1e8d9a4c55",
  "message": "Inventory updated successfully.",
  "movements": [
    {
      "id": "b46ce8db-067b-4767-bae3-aa36b864c380",
      "movement_type": "addition",
      "product_id": "fd187a5a-471f-4a19-80a4-200e6b33d8be",
      "product_variant_id": null,
      "quantity": 10,
      "previous_quantity": 25,
      "new_quantity": 35,
      "notes": "Restock from supplier",
      "user_id": "7cff08d3-510f-4e57-87d3-6785cb5fa1a7",
      "created_datetime": "2025-10-09T21:46:51.369504Z",
      "run_id": "f6a6e1d0-6f7a-4b3e-9c1f-2c1e8d9a4c55"
    },
    {
      "id": "c25ce8db-067b-4767-bae3-aa36b864c381",
      "movement_type": "addition",
      "product_id": "a29ffbc1-1c25-46c8-9dc1-b1e0d4",
      "product_variant_id": "a29ffbc1-1c25-46c8-9dc1-b67839b1e0d4-v1",
      "quantity": 5.4,
      "previous_quantity": 40.2,
      "new_quantity": 45.6,
      "notes": "Restock from supplier",
      "user_id": "7cff08d3-510f-4e57-87d3-6785cb5fa1a7",
      "created_datetime": "2025-10-09T21:46:51.369504Z",
      "run_id": "f6a6e1d0-6f7a-4b3e-9c1f-2c1e8d9a4c55"
    }
  ]
}
```

#### Example Error Response (JSON)
```json
{
  "status": "error",
  "applied": false,
  "run_id": "2b7f8a5b-83c3-4c08-9f86-7a9e5e0e3a9d",
  "message": "One or more inventory movements failed. No changes were applied.",
  "errors": [
    { "product_id": "xxxx", "reason": "Product not found" },
    { "product_variant_id": "yyyy-v1", "reason": "Variant inactive" }
  ]
}
```

#### Example Validation Response (JSON) — Dry-Run Count
```json
{
  "status": "success",
  "applied": false,
  "run_id": "c9eb4d2f-0c3a-4a4e-9a6e-5f7d0d3e6a21",
  "movement_type": "count",
  "needs_recount": [
    { "product_id": "a29ffbc1-1c25-46c8-9dc1-b67839b1e0d4", "label": "Producto B - 500ml" }
  ],
  "message": "Recount required for 1 product"
}
```

### Expected Movement Object Schema (JSON)
```json
{
  "id": "string-uuid",
  "product_id": "string-uuid",
  "product_variant_id": "string-uuid | null",
  "movement_type": "addition | adjustment | count",
  "quantity": 10,
  "previous_quantity": 25,
  "new_quantity": 35,
  "notes": "string",
  "user_id": "string-uuid",
  "created_datetime": "2025-10-09T21:46:51.369504Z",
  "updated_datetime": "2025-10-09T21:46:51.369504Z",
  "run_id": "string-uuid"   // FK → inventory_movement_run.id
}
```