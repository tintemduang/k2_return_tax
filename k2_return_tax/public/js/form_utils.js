window.form_utils = window.form_utils || {};

/**
 * จัดตำแหน่ง Button field
 * align: left | center | right
 */
form_utils.align_button = function (frm, fieldname, align = "left") {
    const field = frm.fields_dict[fieldname];
    if (!field || !field.$wrapper) return;

    let textAlign = "left";
    let floatAlign = "left";

    if (align === "center") {
        textAlign = "center";
        floatAlign = "none";
    } else if (align === "right") {
        textAlign = "right";
        floatAlign = "right";
    }

    field.$wrapper.css({ "text-align": textAlign });
    field.$wrapper.find("button").css({ "float": floatAlign });
};

/**
 * เปลี่ยนสี / style ปุ่ม
 * style: default | primary | blue | success | warning | danger | secondary
 */
form_utils.style_button = function (frm, fieldname, style = "default") {
    const field = frm.fields_dict[fieldname];
    if (!field || !field.$wrapper) return;

    const btn = field.$wrapper.find("button");

    btn.removeClass(
        "btn-default btn-primary btn-success btn-warning btn-danger btn-info btn-secondary"
    );

    switch (style) {
        case "info":
            btn.addClass("btn-info");
            break;
        case "primary":
            btn.addClass("btn-primary");
            break;
        case "success":
            btn.addClass("btn-success");
            break;
        case "warning":
            btn.addClass("btn-warning");
            break;
        case "danger":
            btn.addClass("btn-danger");
            break;
        case "secondary":
            btn.addClass("btn-secondary");
            break;
        default:
            btn.addClass("btn-default");
    }
};
