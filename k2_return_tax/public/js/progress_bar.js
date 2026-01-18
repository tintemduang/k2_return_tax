window.progress_bar = window.progress_bar || {};

progress_bar.render_progress_bar = function render_progress_from_status(frm) {
    if (!frm.doc.document_status) {
        return;
    }

    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "RTT Form Status",
            name: frm.doc.document_status
        },
        callback: function (r) {
            if (!r.message) return;

            const state_name = r.message.state;
            render_progress_bar_by_state(frm, state_name);
        }
    });
}

function render_progress_bar_by_state(frm, currentState) {

    const states = [
        "สาขา",
        "ทะเบียน",
        "ฝ่ายบัญชี",
        "เสร็จสิ้น"
    ];

    const currentIndex = states.findIndex(s => s === currentState);

    if (currentIndex === -1) {
        console.warn("Unknown state:", currentState);
        return;
    }

    let html = `
        <div class="custom-progress">
            ${states.map((label, index) => {
                let cls = "pending";
                let content = index + 1;

                if (index < currentIndex) {
                    cls = "done";
                    content = "✓";
                } else if (index === currentIndex) {
                    cls = "active";
                }

                return `
                    <div class="step ${cls}">
                        <div class="circle">${content}</div>
                        <div class="label">${label}</div>
                    </div>
                `;
            }).join("")}
        </div>
    `;

    frm.fields_dict.workflow_state_html.$wrapper.html(html);
}