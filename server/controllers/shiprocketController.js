const shiprocketService = require('../services/shiprocket');

exports.checkPincode = async (req, res) => {
  try {
    const { pincode } = req.params;
    if (!pincode || pincode.length !== 6) {
      return res.status(400).json({ success: false, message: 'Invalid pincode format' });
    }

    const result = await shiprocketService.checkServiceability(pincode);
    
    // Extract the delivery date range if available
    let estimatedDate = null;
    if (result.serviceable && result.data.available_courier_companies.length > 0) {
      const couriers = result.data.available_courier_companies.filter(c => c.etd);
      
      if (couriers.length > 0) {
        const sorted = couriers.sort((a,b) => new Date(a.etd) - new Date(b.etd));
        
        const earliest = new Date(sorted[0].etd);
        const latest = new Date(sorted[sorted.length - 1].etd);

        const fmt = { day: 'numeric', month: 'short' };
        const d1 = earliest.toLocaleDateString('en-IN', fmt);
        const d2 = latest.toLocaleDateString('en-IN', fmt);

        if (d1 === d2) {
          estimatedDate = d1;
        } else {
          estimatedDate = `${d1} - ${d2}`;
        }
      }
    }

    res.json({
      ...result,
      estimatedDate
    });
  } catch (error) {
    console.error("checkPincode error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
