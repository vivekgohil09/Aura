import { CloseIcon } from "@chakra-ui/icons";
import { Badge } from "@chakra-ui/layout";
import { motion } from "framer-motion";

const UserBadgeItem = ({ user, handleFunction, admin }) => {
    return (
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ display: 'inline-block' }}>
            <Badge
                px={3}
                py={1.5}
                borderRadius="99px"
                m={1}
                mb={2}
                fontSize={12}
                fontWeight={700}
                bg="linear-gradient(135deg, #E63946 0%, #d62839 100%)"
                color="#FFFFFF"
                cursor="pointer"
                onClick={handleFunction}
                style={{ 
                    textTransform: "none", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "6px",
                    boxShadow: "0 3px 10px rgba(230, 57, 70, 0.25)",
                    border: "none"
                }}
            >
                {user.name}
                {admin === (user._id || user.id) && <span style={{ color: "#FFE3E6" }}> (Admin)</span>}
                <CloseIcon fontSize="8px" style={{ opacity: 0.85 }} />
            </Badge>
        </motion.div>
    );
};

export default UserBadgeItem;