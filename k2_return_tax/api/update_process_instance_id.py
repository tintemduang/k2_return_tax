import frappe

@frappe.whitelist(methods=["POST"])
def update_process_instance_id(
    doctype,
    document_number,
    process_instance_id
):
    doc = frappe.get_doc(doctype, document_number)
    doc.process_instance_id = process_instance_id

    doc.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "result": "success",
        "action": "update_process_instance_id",
        "doctype": doctype,
        "document_number": document_number,
        "process_instance_id": process_instance_id
    }