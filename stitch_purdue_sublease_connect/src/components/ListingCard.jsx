import { Link } from "react-router-dom";

export function ListingCard({ listing, showOwner = true, compact = false }) {
  return (
    <article className={`listing-card ${compact ? "compact" : ""}`}>
      <div className="listing-visual">
        <div className="listing-chip">Verified Purdue Listing</div>
      </div>
      <div className="listing-body">
        <div className="listing-row">
          <div>
            <h3>{listing.title}</h3>
            <p className="muted">{listing.address || "West Lafayette, IN"}</p>
          </div>
          <div className="price-tag">${listing.price}</div>
        </div>
        <p className="muted">
          {listing.start_date} to {listing.end_date}
        </p>
        <p className="muted">
          {listing.bedrooms ?? "?"} bed · {listing.bathrooms ?? "?"} bath
        </p>
        <div className="pill-row">
          {(listing.amenities || []).slice(0, 4).map((item) => (
            <span className="pill" key={item}>
              {item}
            </span>
          ))}
        </div>
        {showOwner && listing.owner ? (
          <p className="muted">
            Listed by {listing.owner.full_name || listing.owner.email}
          </p>
        ) : null}
        <Link className="link-button secondary-button" to={`/listings/${listing.id}`}>
          View details
        </Link>
      </div>
    </article>
  );
}
