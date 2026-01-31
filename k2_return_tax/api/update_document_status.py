import frappe

@frappe.whitelist(methods=["POST"])
def update_status(
    document_name,
    document_number,
    status
):
    doc = frappe.get_doc(document_name, document_number)
    doc.document_status = status

    doc.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "result": "success",
        "action": "update_status",
        "document_name": document_name,
        "document_number": document_number,
        "status": status
    }