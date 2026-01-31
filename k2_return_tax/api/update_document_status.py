import frappe

@frappe.whitelist(methods=["POST"])
def update_status(
    doc_type,
    doc_name,
    status,
    process_instance_id=None,
    remark=None
):
    doc = frappe.get_doc(doc_type, doc_name)

    doc.document_status = status

    if process_instance_id:
        doc.process_instance_id = process_instance_id

    if remark:
        doc.remark = remark

    doc.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "result": "success",
        "action": "update_status",
        "doc_type": doc_type,
        "doc_name": doc_name,
        "status": status
    }
