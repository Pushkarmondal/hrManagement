export const requireEmployeeAuth = (req:any, res:any, next:any) => {
    if(!req.employee) {
        return res.status(401).json({
            success: false,
            error: "Employee authentication required"
        });
    }
    next();
}