const StarBorder = ({
  as: Component = 'button',
  className = '',
  color = 'rgba(220, 235, 255, 0.95)',
  speed = '6s',
  thickness = 1,
  children,
  ...rest
}) => {
  const incomingStyle = rest.style ?? {};

  return (
    <Component
      className={`star-border ${className}`}
      style={{
        '--star-color': color,
        '--star-speed': speed,
        '--star-thickness': `${thickness}px`,
        ...incomingStyle
      }}
      {...rest}>
      <span className="star-border__beam star-border__beam--top" aria-hidden="true" />
      <span className="star-border__beam star-border__beam--bottom" aria-hidden="true" />
      <span className="star-border__content">
        {children}
      </span>
    </Component>
  );
};

export default StarBorder;
