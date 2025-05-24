function formatDate(date) {
    if (!date) return null;
    // Return as YYYY-MM-DD
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTimestamps(obj) {
    if (Array.isArray(obj)) {
        return obj.map(formatTimestamps);
    }
    if (obj && typeof obj === 'object') {
        // Handle Sequelize instances
        if (typeof obj.toJSON === 'function') {
            obj = obj.toJSON();
        }
        const newObj = { ...obj };
        for (const key of Object.keys(newObj)) {
            if (key === 'createdAt' || key === 'updatedAt') {
                newObj[key] = formatDate(newObj[key]);
            } else if (typeof newObj[key] === 'object' && newObj[key] !== null) {
                newObj[key] = formatTimestamps(newObj[key]);
            }
        }
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
