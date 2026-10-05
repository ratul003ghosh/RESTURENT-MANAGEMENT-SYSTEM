(function () {
    window.rmsRequest = async function (action, options) {
        const settings = options || {};
        const query = new URLSearchParams({ action: action });
        if (settings.params) {
            Object.entries(settings.params).forEach(function (entry) {
                if (entry[1] !== null && entry[1] !== undefined && entry[1] !== "") {
                    query.set(entry[0], entry[1]);
                }
            });
        }
        const response = await fetch("api/index.php?" + query.toString(), {
            method: settings.method || "GET",
            credentials: "same-origin",
            headers: settings.body ? { "Content-Type": "application/json" } : {},
            body: settings.body ? JSON.stringify(settings.body) : undefined
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "The request could not be completed.");
        }
        return result;
    };
})();