(function () {
    async function reviewRequest(action, options) {
        const settings = options || {};
        let response;
        try {
            response = await fetch("api/admin.php?action=" + encodeURIComponent(action), {
                method: settings.method || "GET",
                credentials: "same-origin",
                headers: settings.body ? { "Content-Type": "application/json" } : {},
                body: settings.body ? JSON.stringify(settings.body) : undefined
            });
        } catch (error) {
            throw new Error("Could not reach the server. Make sure Apache and MySQL are running.");
        }
        const result = await response.json();
        if (!response.ok || result.success !== true) throw new Error(result.message || "The request could not be completed.");
        return result;
    }

    function make(tag, text, className) {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    }

    function renderReviews(reviews, container, cardClass) {
        if (!container) return;
        container.replaceChildren();
        if (!reviews.length) {
            container.appendChild(make("p", "No approved reviews yet. Be the first to share your experience."));
            return;
        }
        reviews.forEach(function (review) {
            const card = make("div", undefined, cardClass);
            card.appendChild(make("div", "★".repeat(Number(review.rating)) + "☆".repeat(5 - Number(review.rating)), "review-stars"));
            card.appendChild(make("p", review.comment));
            const author = make("div", undefined, "review-author");
            author.appendChild(make("span", review.name, "author-name"));
            author.appendChild(make("span", new Date(review.created_at.replace(" ", "T")).toLocaleDateString(), "review-date"));
            card.appendChild(author);
            container.appendChild(card);
        });
    }

    function showError(target, error) {
        if (target) {
            target.replaceChildren(make("p", error.message, "error"));
        }
    }

    const form = document.getElementById("feedbackForm");
    const feedbackFeed = document.getElementById("reviewFeed");
    const reviewsGrid = document.getElementById("reviewGrid");
    const reviewContainer = feedbackFeed || reviewsGrid;

    if (form) {
        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            const message = document.getElementById("feedbackMessage");
            const fields = Object.fromEntries(new FormData(form));
            try {
                const result = await reviewRequest("submit_review", {
                    method: "POST",
                    body: { ...fields, rating: Number(fields.rating) }
                });
                form.reset();
                message.textContent = result.message;
                message.classList.remove("error");
            } catch (error) {
                message.textContent = error.message;
                message.classList.add("error");
            }
        });
    }

    if (reviewContainer) {
        reviewRequest("published_reviews").then(function (result) {
            renderReviews(result.reviews, reviewContainer, feedbackFeed ? "feed-card" : "review-card");
            if (reviewsGrid) {
                const average = result.reviews.length
                    ? result.reviews.reduce(function (sum, review) { return sum + Number(review.rating); }, 0) / result.reviews.length
                    : 0;
                const score = document.querySelector(".score-num");
                const count = document.querySelector(".score-count");
                const stars = document.querySelector(".big-score .score-stars");
                if (score) score.textContent = result.reviews.length ? average.toFixed(1) : "—";
                if (count) count.textContent = result.reviews.length
                    ? "Based on " + result.reviews.length + " approved reviews"
                    : "No approved reviews yet";
                if (stars) stars.textContent = "★".repeat(Math.round(average)) + "☆".repeat(5 - Math.round(average));
                const breakdown = document.querySelector(".breakdown-list");
                if (breakdown) {
                    const categoryNames = { food: "Food Quality", service: "Service", booking: "Table Reservation", ambience: "Ambience" };
                    breakdown.replaceChildren();
                    ["food", "service", "booking", "ambience"].forEach(function (category) {
                        const categoryReviews = result.reviews.filter(function (review) { return review.category === category; });
                        const categoryAverage = categoryReviews.length
                            ? categoryReviews.reduce(function (sum, review) { return sum + Number(review.rating); }, 0) / categoryReviews.length
                            : 0;
                        const row = make("div", undefined, "breakdown-row");
                        row.appendChild(make("span", categoryNames[category]));
                        const bar = make("div", undefined, "bar-bg");
                        const fill = make("div", undefined, "bar-fill");
                        fill.style.width = categoryAverage ? (categoryAverage / 5 * 100) + "%" : "0%";
                        bar.appendChild(fill);
                        row.append(bar, make("span", categoryReviews.length ? categoryAverage.toFixed(1) : "—"));
                        breakdown.appendChild(row);
                    });
                }
            }
        }).catch(function (error) { showError(reviewContainer, error); });
    }
}());
