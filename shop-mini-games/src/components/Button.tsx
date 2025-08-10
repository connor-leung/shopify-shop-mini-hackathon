import React from 'react';
import styled from 'styled-components';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    children: React.ReactNode;
    fullWidth?: boolean;
}

const StyledButton = styled.button<{ variant: ButtonVariant; fullWidth?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    width: ${props => props.fullWidth ? '100%' : 'auto'};
    
    ${({ variant }) => 
        variant === 'primary' 
            ? `
                background-color: #5c6ac4;
                color: white;
                border: 1px solid #5c6ac4;
                &:hover {
                    background-color: #4959bd;
                    border-color: #4959bd;
                }
            `
            : `
                background-color: transparent;
                color: #5c6ac4;
                border: 1px solid #5c6ac4;
                &:hover {
                    background-color: rgba(92, 106, 196, 0.05);
                }
            `
    }
    
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const Button: React.FC<ButtonProps> = ({ 
    variant = 'primary',
    children, 
    fullWidth = false,
    ...props 
}) => {
    return (
        <StyledButton
            variant={variant}
            fullWidth={fullWidth}
            {...props}
        >
            {children}
        </StyledButton>
    );
};

export default Button;