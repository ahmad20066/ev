function formatDate(date) {
    if (!date) return null;
    // ISO 8601 or customize as needed
    return new Date(date).toISOString();
}

function formatTimestamps(obj) {
    if (Array.isArray(obj)) {
        return obj.map(formatTimestamps);
    }
    if (obj && typeof obj === 'object') {
        const newObj = { ...obj };
        if (newObj.createdAt) newObj.createdAt = formatDate(newObj.createdAt);
        if (newObj.updatedAt) newObj.updatedAt = formatDate(newObj.updatedAt);
        // Recursively format nested objects
        Object.keys(newObj).forEach(key => {
            if (typeof newObj[key] === 'object') {
                newObj[key] = formatTimestamps(newObj[key]);
            }
        });
        return newObj;
    }
    return obj;
}

module.exports = (req, res, next) => {
    const oldJson = res.json;
    res.json = function (data) {
        oldJson.call(this, formatTimestamps(data));
    };
    next();
};
