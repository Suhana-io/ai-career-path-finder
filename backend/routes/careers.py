from flask import Blueprint, jsonify
from models.models import Career

careers_bp = Blueprint('careers', __name__)


@careers_bp.route('/', methods=['GET'])
def list_careers():
    careers = Career.query.all()
    return jsonify({'careers': [c.to_dict() for c in careers]}), 200


@careers_bp.route('/<int:career_id>', methods=['GET'])
def get_career(career_id):
    career = Career.query.get_or_404(career_id)
    data   = career.to_dict()
    data['resources'] = [r.to_dict() for r in career.resources]
    return jsonify({'career': data}), 200


@careers_bp.route('/<int:career_id>/resources', methods=['GET'])
def get_resources(career_id):
    career = Career.query.get_or_404(career_id)
    return jsonify({'resources': [r.to_dict() for r in career.resources]}), 200