const Listing = require('../models/listing')
const mbxGeocoding = require("@googlemaps/google-maps-services-js");
const mapToken = process.env.GOOGLE_MAPS_API_KEY;
const geocodingClient = new mbxGeocoding.Client({});

module.exports.index = async (req, res) => {
    let { q, category } = req.query;
    let query = {};
    if (q) {
        query.$or = [
            { title: { $regex: q, $options: 'i' } },
            { location: { $regex: q, $options: 'i' } },
            { country: { $regex: q, $options: 'i' } }
        ];
    }
    if (category) {
        query.category = category;
    }
    const allListings = await Listing.find(query);
    res.render("listings/index.ejs", { allListings });
}

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs")
}

module.exports.showListings = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({
        path: "reviews",
        populate: {
            path: "author",
        },
    }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings")
    }
    console.log(listing);
    res.render("listings/show.ejs", { listing });
}

module.exports.createListing = async (req, res, next) => {
    let response;
    try {
        response = await geocodingClient.geocode({
            params: {
                address: req.body.listing.location,
                key: mapToken,
            },
            timeout: 1000, // milliseconds
        });
    } catch (err) {
        console.log("Geocoding failed:", err.message);
    }

    if (!req.file) {
        req.flash("error", "Please upload an image");
        return res.redirect("/listings/new");
    }

    let url = req.file.path || req.file.url || req.file.secure_url;
    let filename = req.file.filename || req.file.originalname;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    if (response && response.data.results.length > 0) {
        newListing.geometry = response.data.results[0].geometry.location;
        newListing.geometry = { type: 'Point', coordinates: [response.data.results[0].geometry.location.lng, response.data.results[0].geometry.location.lat] };
    } else {
        newListing.geometry = { type: 'Point', coordinates: [0, 0] };
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
}

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings")
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250")
    res.render("listings/edit.ejs", { listing, originalImageUrl });
}

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    let response;
    try {
        response = await geocodingClient.geocode({
            params: {
                address: req.body.listing.location,
                key: mapToken,
            },
            timeout: 1000, // milliseconds
        });
    } catch (err) {
        console.log("Geocoding failed:", err.message);
    }

    if (response && response.data.results.length > 0) {
        listing.geometry = { type: 'Point', coordinates: [response.data.results[0].geometry.location.lng, response.data.results[0].geometry.location.lat] };
        await listing.save();
    }


    if (typeof req.file !== "undefined") {
        let url = req.file.path || req.file.url || req.file.secure_url;
        let filename = req.file.filename || req.file.originalname;
        console.log(url, "...", filename);

        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!")
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!")
    res.redirect("/listings");
}