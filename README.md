Web-Application AOP-networkFinder is available under:
https://aop-networkfinder.no/


How to cite the AOP-networkFinder:
MS ID#: BIORXIV/2024/591733
AOP-networkFinder - A versatile and user-friendly tool for FAIR reconstruction of Adverse Outcome Pathway networks from the AOP-Wiki"
Nurettin Yarar, Marvin Martens, Torbjørn Rognes, Jan Lavender, Hubert Dirven, Karine Audouze, Marcin W. Wojewodzic#
# correspondence marcin.wojewodzic@kreftregisteret.no




![alt text|100](/images/AOP-networkFinder_for_paper.jpg)

Figure 1 Graphic mark of "AOP-networkFinder. Green represent Molecular Initiation Events (MIEs) in the Adverse Outcome Pathway (AOP). Orange represent adherent Key Events (KEs). Red triangles represent Adverse Outcomes (AOs), at the end of the path. The arrows illustrate the direction of Key Events Relationships (KERs). Blue circles represent genes connected to KEs. Notice that this representation is in form a Directed Acyclic Graph (DAG) with no directed cycles.

Finds the status of all AOPs in the webpage AOPWiki.org/aops (OECD Status)


The Current GUI of the AOP_Visualizer webpage:

 ![main window](/images/Figures_AOP-network-finder_02032024-Figure1_Jan.jpg)


 # How to run the application locally

# How to use

### Prerequisites
Docker installed on your system.

### Building the Docker Image
To build the Docker image, use the following command:
```
docker build --platform=linux/amd64 -t aop-networkfinder:v1 .
```

### Running the Application

To run the Docker Container:
```
docker run --platform=linux/amd64 -d -p 8000:8000 -e aop-networkfinder:v1
```

To access the application locally:
http://localhost:8000

You should see a window similar to this:

![main window](/images/AOPnetworkFinder_main_page.png)

