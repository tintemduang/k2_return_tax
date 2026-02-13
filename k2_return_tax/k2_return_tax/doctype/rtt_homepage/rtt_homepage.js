frappe.ui.form.on("RTT Homepage", {
	refresh(frm) {
        frm.current_page = 0;   // เริ่มหน้าแรก
        load_k2_worklist(frm);
        load_rtt_request_table(frm);
	},
});

function load_k2_worklist(frm) {

    if (!frm.k2_page) {
        frm.k2_page = 0;
    }

    let page_length = 5;

    frappe.call({
        method: "k2_return_tax.k2_return_tax.doctype.rtt_worklist.rtt_worklist.get_worklist_for_homepage",
        args: {
            start: frm.k2_page * page_length,
            page_length: page_length
        },
        callback: function(r) {

            let html = `
                <div class="card" style="padding:15px; margin-bottom:3px;">
                    <h4>📌 ${__("My Worklist")}</h4>
                    <hr>

                    <table class="table table-bordered table-hover">
                        <thead>
                            <tr>
                                <th>${__("Folio")}</th>
                                <th>${__("Workflow")}</th>
                                <th>${__("Activity")}</th>
                                <th>${__("Status")}</th>
                                <th>${__("Start Date")}</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (!r.message || r.message.length === 0) {
                html += `
                    <tr>
                        <td colspan="5" class="text-center">
                            ${__("No tasks found")}
                        </td>
                    </tr>
                `;
            } else {
                r.message.forEach(row => {

                    let doc_no = row.folio
                        ? row.folio.split(":")[0].trim()
                        : "";

                    let link = `/app/rtt-request-form/${doc_no}?serial_number=${row.serial_number || ""}`;

                    let formatted_date = row.start_date
                        ? frappe.datetime.obj_to_user(
                            frappe.datetime.str_to_obj(row.start_date)
                          )
                        : "";

                    html += `
                        <tr>
                            <td><a href="${link}" target="_blank">${row.folio}</a></td>
                            <td>${row.workflow_display_name}</td>
                            <td>${row.activity_name}</td>
                            <td>${row.task_status}</td>
                            <td>${formatted_date}</td>
                        </tr>
                    `;
                });
            }

            html += `
                        </tbody>
                    </table>

                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
                        <button class="btn btn-xs btn-default k2-prev"
                            ${frm.k2_page === 0 ? "disabled" : ""}>
                            ${__("Previous")}
                        </button>

                        <button class="btn btn-xs btn-default k2-next"
                            ${(r.message && r.message.length < page_length) ? "disabled" : ""}>
                            ${__("Next")}
                        </button>
                    </div>
                </div>
            `;

            // ถ้ายังไม่มี container
            if (!frm.fields_dict.homepage_html.$wrapper.find(".k2-worklist").length) {
                frm.fields_dict.homepage_html.$wrapper.prepend(
                    `<div class="k2-worklist"></div>`
                );
            }

            // update เฉพาะส่วนนี้
            frm.fields_dict.homepage_html.$wrapper
                .find(".k2-worklist")
                .html(html);

            // bind event
            frm.fields_dict.homepage_html.$wrapper
                .find(".k2-prev")
                .on("click", function () {
                    if (frm.k2_page > 0) {
                        frm.k2_page--;
                        load_k2_worklist(frm);
                    }
                });

            frm.fields_dict.homepage_html.$wrapper
                .find(".k2-next")
                .on("click", function () {
                    if (r.message && r.message.length === page_length) {
                        frm.k2_page++;
                        load_k2_worklist(frm);
                    }
                });
        }
    });
}

function load_rtt_request_table(frm) {

    if (!frm.current_page) {
        frm.current_page = 0;
    }

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "RTT Request Form",
            fields: [
                "name",
                "employee_name",
                "branch",
                "plate_number",
                "creation"
            ],
            filters: {
                owner: frappe.session.user
            },
            limit_page_length: 5,
            limit_start: frm.current_page * 5,
            order_by: "creation desc"
        },
        callback: function(r) {

            let html = `
                <div class="card" style="padding:15px; margin-bottom:3px;">
                    <h4 style="margin:0;">📄 ${__("Document History")}</h4>
                    <hr style="margin:8px 0;">

                    <table class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>Document No</th>
                                <th>Employee Name</th>
                                <th>Branch</th>
                                <th>Plate Number</th>
                                <th>Creation</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (!r.message || r.message.length === 0) {
                html += `
                    <tr>
                        <td colspan="5" class="text-center">
                            No data found
                        </td>
                    </tr>
                `;
            } else {
                r.message.forEach(row => {
                    html += `
                        <tr>
                            <td>
                                <a href="/app/rtt-request-form/${row.name}">
                                    ${row.name}
                                </a>
                            </td>
                            <td>${row.employee_name || ""}</td>
                            <td>${row.branch || ""}</td>
                            <td>${row.plate_number || ""}</td>
                            <td>${frappe.datetime.str_to_user(row.creation)}</td>
                        </tr>
                    `;
                });
            }

            html += `
                        </tbody>
                    </table>

                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
                        <button class="btn btn-xs btn-default prev-page"
                            ${frm.current_page === 0 ? "disabled" : ""}>
                            Previous
                        </button>

                        <button class="btn btn-xs btn-default next-page"
                            ${(r.message && r.message.length < 5) ? "disabled" : ""}>
                            Next
                        </button>
                    </div>
                </div>
            `;

            // ✅ ถ้ายังไม่มี container ให้สร้าง
            if (!frm.fields_dict.homepage_html.$wrapper.find(".rtt-history").length) {
                frm.fields_dict.homepage_html.$wrapper.append(
                    `<div class="rtt-history"></div>`
                );
            }

            // ✅ update เฉพาะ section นี้
            frm.fields_dict.homepage_html.$wrapper
                .find(".rtt-history")
                .html(html);

            // bind event
            frm.fields_dict.homepage_html.$wrapper
                .find(".prev-page")
                .on("click", function () {
                    if (frm.current_page > 0) {
                        frm.current_page--;
                        load_rtt_request_table(frm);
                    }
                });

            frm.fields_dict.homepage_html.$wrapper
                .find(".next-page")
                .on("click", function () {
                    if (r.message && r.message.length === 5) {
                        frm.current_page++;
                        load_rtt_request_table(frm);
                    }
                });
        }
    });
}
