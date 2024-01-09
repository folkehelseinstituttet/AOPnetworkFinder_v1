from app import app
from flask import render_template, request, jsonify
import app.service.aop_visualizer_service as visualizer_sv
import logging


# Page Routing
@app.route("/")
@app.route("/AOP_Visualizer")
def visualizer_page():
    return render_template('visualizer_page_one.html')


@app.route("/page1")
def page_two():
    return render_template('data_displayer_page_two.html')


@app.route("/page2")
def page_three():
    return render_template('text_mining_page_three.html')


# Post requests
@app.route("/searchAops", methods=['POST'])
def search_aops():
    # Retrieve the query from the form
    aop_query = request.form.get('searchFieldAOP')

    logging.debug(f"aop_query from the search field in front-end {aop_query}")
    print('Test aopQuery: {}'.format(aop_query))

    #handle if there is no data
    if aop_query is None:
        return render_template('visualizer_page_one.html', data=None)

    aop_cytoscape = visualizer_sv.visualize_aop_user_input(aop_query)
    print('Output before sending to front-end: {}'.format(aop_cytoscape))
    return jsonify(aop_cytoscape['elements'])
