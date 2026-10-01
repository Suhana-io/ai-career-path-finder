from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.models import User, Profile, UserSkill

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('/', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user    = User.query.get_or_404(user_id)
    skills  = [{'skill_name': s.skill_name, 'level': s.level} for s in user.skills]
    profile = user.profile.to_dict() if user.profile else {}
    return jsonify({'user': user.to_dict(), 'profile': profile, 'skills': skills}), 200


@profile_bp.route('/', methods=['POST'])
@jwt_required()
def save_profile():
    user_id = int(get_jwt_identity())
    data    = request.get_json()

    profile = Profile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = Profile(user_id=user_id)
        db.session.add(profile)

    profile.branch      = data.get('branch', '')
    profile.year        = data.get('year', 1)
    profile.cgpa        = data.get('cgpa', None)
    profile.interests   = ','.join(data.get('interests', []))
    profile.career_goal = data.get('career_goal', '')

    UserSkill.query.filter_by(user_id=user_id).delete()
    for skill in data.get('skills', []):
        name  = skill.get('skill_name', skill) if isinstance(skill, dict) else skill
        level = skill.get('level', 'beginner')  if isinstance(skill, dict) else 'beginner'
        if name.strip():
            db.session.add(UserSkill(user_id=user_id, skill_name=name.strip(), level=level))

    db.session.commit()
    return jsonify({'message': 'Profile saved successfully'}), 200