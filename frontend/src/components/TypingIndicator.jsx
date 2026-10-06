import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";

const TypingIndicator = ({ userName }) => {
  if (!userName) {
    return null;
  }

  return (
    <div className="px-3 py-2 border-bottom bg-light">
      <div className="d-flex align-items-center gap-2">
        <div className="typing-dots d-flex align-items-center gap-1">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <small className="text-muted">{userName} is typing</small>

        <FontAwesomeIcon
          icon={faEllipsis}
          className="text-muted"
          style={{ fontSize: "11px" }}
        />
      </div>
    </div>
  );
};

export default TypingIndicator;
