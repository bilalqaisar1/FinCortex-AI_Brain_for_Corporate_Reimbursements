from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base

class User(Base):
    __tablename__ = "users"
    user_id = Column(String, primary_key=True)
    full_name = Column(String)
    email = Column(String)
    department_id = Column(Integer)
    role = Column(String)

class Department(Base):
    __tablename__ = "departments"
    department_id = Column(Integer, primary_key=True)
    department_name = Column(String)

class ExpenseCategory(Base):
    __tablename__ = "expense_categories"
    category_id = Column(Integer, primary_key=True)
    category_name = Column(String)
    description = Column(String)
    max_limit = Column(Float)

class Reimbursement(Base):
    __tablename__ = "reimbursements"
    reimbursement_id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.user_id"))
    amount_claimed = Column(Float)
    amount_approved = Column(Float)
    status = Column(String)
    description = Column(String)
    created_at = Column(DateTime)
    category_id = Column(Integer, ForeignKey("expense_categories.category_id"))
    department_id = Column(Integer, ForeignKey("departments.department_id"))

    user = relationship("User")
    category = relationship("ExpenseCategory")
    department = relationship("Department")

class Company(Base):
    __tablename__ = "companies"
    company_id = Column(Integer, primary_key=True)
    company_name = Column(String)

class PolicyViolation(Base):
    __tablename__ = "policy_violations"
    violation_id = Column(Integer, primary_key=True)
    reimbursement_id = Column(Integer, ForeignKey("reimbursements.reimbursement_id"))
    user_id = Column(String, ForeignKey("users.user_id"))
    company_id = Column(Integer)
    violation_type = Column(String)
    description = Column(String)
    is_resolved = Column(Boolean)
    created_at = Column(DateTime)

    reimbursement = relationship("Reimbursement")
    user = relationship("User")
