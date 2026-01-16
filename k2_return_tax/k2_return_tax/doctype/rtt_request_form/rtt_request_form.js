// Copyright (c) 2026, tin.t and contributors
// For license information, please see license.txt

frappe.ui.form.on('RTT Request Form', {
    refresh(frm) {
        form_utils.align_button(frm, "request_button", "center");
        form_utils.style_button(frm, "request_button", "blue");
    }
});