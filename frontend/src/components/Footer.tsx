export default function Footer() {
    return (
        <footer style={{
            marginTop: "0px",
            padding: "40px 20px",
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px"
        }}>
            {/* Product Hunt Badge */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
            }}>
                <a
                    href="https://www.producthunt.com/products/codeown?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-codeown"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        alt="Codeown - A social platform for developers to share projects and ideas | Product Hunt"
                        width="250"
                        height="54"
                        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1072186&theme=light&t=1770201427808"
                    />
                </a>
            </div>

            {/* FoundrList */}
            <a href="https://foundrlist.com/product/codeown" target="_blank" rel="noopener noreferrer">
                <img
                    src="https://foundrlist.com/api/badge/codeown"
                    alt="Live on FoundrList"
                    width="180"
                    height="72"
                />
            </a>

            {/* Footer Text */}
            <div style={{
                textAlign: "center",
                color: "#64748b",
                fontSize: "14px"
            }}>
                <p style={{ margin: "0 0 8px 0" }}>
                    © {new Date().getFullYear()} SeedLab. All rights reserved.
                </p>
                <div style={{
                    display: "flex",
                    gap: "16px",
                    justifyContent: "center",
                    flexWrap: "wrap"
                }}>
                    <a href="/privacy" style={{ color: "#64748b", textDecoration: "none" }}>Privacy Policy</a>
                    <span>•</span>
                    <a href="/terms" style={{ color: "#64748b", textDecoration: "none" }}>Terms of Service</a>
                    <span>•</span>
                    <a href="/about" style={{ color: "#64748b", textDecoration: "none" }}>About Us</a>
                </div>
            </div>
        </footer>
    );
}
