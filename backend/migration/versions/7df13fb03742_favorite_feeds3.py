"""favorite feeds3

Revision ID: 7df13fb03742
Revises: c5c507639891
Create Date: 2025-03-13 14:20:02.683168

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7df13fb03742'
down_revision: Union[str, None] = 'c5c507639891'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Add the column with a default value, but allow NULLs initially
    op.add_column('feeds', sa.Column('is_favorited', sa.Boolean(), nullable=True))

    # Step 2: Set the default value for existing rows
    op.execute("UPDATE feeds SET is_favorited = FALSE")

    # Step 3: Alter the column to be NOT NULL
    op.alter_column('feeds', 'is_favorited', nullable=False)


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('feeds', 'is_favorited')
    # ### end Alembic commands ###
